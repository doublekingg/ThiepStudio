import React, { useEffect, useRef, useState } from 'react';
import { Eye, Maximize2, Minimize2, Pause, Play, RotateCcw, Trash2 } from 'lucide-react';
import { ASPECT_RATIOS } from '../data/presets';
import {
  getCollageBox,
  getStickerBox,
  getTypographyLayout,
  GizmoHandleId,
  ObjectBox,
  preloadImages,
  renderCardFrame,
} from '../engine/cardRenderer';
import { ParticleEngine } from '../engine/particleEngine';
import { AspectRatioId, CardDesignState, SelectedObject } from '../types/studio';

interface CanvasStageProps {
  design: CardDesignState;
  selectedObject: SelectedObject;
  onSelectObject: (obj: SelectedObject) => void;
  onUpdateDesign: (updater: (prev: CardDesignState) => CardDesignState) => void;
  onChangeAspectRatio: (ratio: AspectRatioId) => void;
  onOpenPreview: () => void;
  mobileExpanded?: boolean;
  onToggleMobileExpand?: () => void;
}

type InteractionState =
  | {
      kind: 'move';
      target: NonNullable<SelectedObject>;
      offsetX: number; // canvas px offset from center
      offsetY: number;
    }
  | {
      kind: 'resize';
      target: NonNullable<SelectedObject>;
      handle: GizmoHandleId;
      cx: number;
      cy: number;
      initDist: number;
      initScale: number;
      initHeadlineSize: number;
      initBodySize: number;
    }
  | {
      kind: 'rotate';
      uid: string;
      cx: number;
      cy: number;
    };

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

function getCursorForHandle(handle: GizmoHandleId): string {
  switch (handle) {
    case 'nw':
    case 'se':
      return 'nwse-resize';
    case 'ne':
    case 'sw':
      return 'nesw-resize';
    case 'w':
    case 'e':
      return 'ew-resize';
    case 'n':
    case 's':
      return 'ns-resize';
    case 'rotate':
      return 'crosshair';
  }
}

export function CanvasStage({
  design,
  selectedObject,
  onSelectObject,
  onUpdateDesign,
  onChangeAspectRatio,
  onOpenPreview,
  mobileExpanded = false,
  onToggleMobileExpand,
}: CanvasStageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<ParticleEngine | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [hoverCursor, setHoverCursor] = useState<string>('default');
  const elapsedRef = useRef(0);
  const interactionRef = useRef<InteractionState | null>(null);

  const spec = ASPECT_RATIOS.find((r) => r.id === design.aspectRatio) || ASPECT_RATIOS[0];

  // Preload template & collage images
  useEffect(() => {
    preloadImages([
      design.bgImageUrl,
      ...design.collage.slots.map((s) => s.imageUrl),
    ]);
  }, [design.bgImageUrl, design.collage.slots]);

  // Reset timeline on template or animation change
  useEffect(() => {
    elapsedRef.current = 0;
    setElapsedMs(0);
  }, [design.templateId, design.text.animation]);

  // 60fps real-time render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = spec.width;
    canvas.height = spec.height;

    if (!engineRef.current) {
      engineRef.current = new ParticleEngine(spec.width, spec.height);
    } else {
      engineRef.current.resize(spec.width, spec.height);
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let lastTime = performance.now();

    const frame = (now: number) => {
      const delta = Math.min(48, now - lastTime);
      lastTime = now;

      if (isPlaying) {
        elapsedRef.current += delta;
      }

      const dtFactor = isPlaying ? delta / 16.667 : 0;
      renderCardFrame(ctx, spec.width, spec.height, design, engineRef.current!, {
        elapsedMs: elapsedRef.current,
        selectedObject,
        dtFactor,
      });

      rafId = requestAnimationFrame(frame);
    };

    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, [design, spec.width, spec.height, isPlaying, selectedObject]);

  // Periodic UI timer sync without re-rendering canvas loop at 60Hz
  useEffect(() => {
    if (!isPlaying) return;
    const id = window.setInterval(() => {
      setElapsedMs(elapsedRef.current);
    }, 150);
    return () => window.clearInterval(id);
  }, [isPlaying]);

  const handleReplay = () => {
    elapsedRef.current = 0;
    setElapsedMs(0);
    engineRef.current?.reset();
    setIsPlaying(true);
  };

  const getCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { px: spec.width / 2, py: spec.height / 2 };
    const rect = canvas.getBoundingClientRect();
    return {
      px: ((e.clientX - rect.left) / rect.width) * spec.width,
      py: ((e.clientY - rect.top) / rect.height) * spec.height,
    };
  };

  const hitTestSelectedHandles = (
    px: number,
    py: number,
    ctx: CanvasRenderingContext2D
  ): { handle: GizmoHandleId; cx: number; cy: number } | null => {
    if (!selectedObject) return null;
    const scaleFactor = spec.width / 720;
    const hitR = 16 * scaleFactor;

    if (selectedObject.type === 'sticker') {
      const sticker = design.stickers.find((s) => s.uid === selectedObject.uid);
      if (!sticker) return null;
      const sBox = getStickerBox(spec.width, spec.height, sticker);
      // Transform pointer into sticker's local unrotated space
      const dx = px - sBox.cx;
      const dy = py - sBox.cy;
      const rad = (-sBox.rotation * Math.PI) / 180;
      const lx = dx * Math.cos(rad) - dy * Math.sin(rad);
      const ly = dx * Math.sin(rad) + dy * Math.cos(rad);

      const corners: Array<{ id: GizmoHandleId; x: number; y: number }> = [
        { id: 'rotate', x: 0, y: -sBox.half - 22 * scaleFactor },
        { id: 'nw', x: -sBox.half, y: -sBox.half },
        { id: 'ne', x: sBox.half, y: -sBox.half },
        { id: 'sw', x: -sBox.half, y: sBox.half },
        { id: 'se', x: sBox.half, y: sBox.half },
      ];
      for (const c of corners) {
        if (Math.hypot(lx - c.x, ly - c.y) <= hitR) {
          return { handle: c.id, cx: sBox.cx, cy: sBox.cy };
        }
      }
      return null;
    }

    let box: ObjectBox | null = null;
    let allowVerticalSides = false;
    if (selectedObject.type === 'text') {
      box = getTypographyLayout(ctx, spec.width, spec.height, design, elapsedRef.current).box;
    } else if (selectedObject.type === 'collage' && design.collage.layout !== 'none') {
      box = getCollageBox(spec.width, spec.height, design.collage);
      allowVerticalSides = true;
    }
    if (!box) return null;

    const handles: Array<{ id: GizmoHandleId; x: number; y: number }> = [
      { id: 'nw', x: box.x, y: box.y },
      { id: 'ne', x: box.x + box.w, y: box.y },
      { id: 'sw', x: box.x, y: box.y + box.h },
      { id: 'se', x: box.x + box.w, y: box.y + box.h },
      { id: 'w', x: box.x, y: box.cy },
      { id: 'e', x: box.x + box.w, y: box.cy },
    ];
    if (allowVerticalSides) {
      handles.push(
        { id: 'n', x: box.cx, y: box.y },
        { id: 's', x: box.cx, y: box.y + box.h }
      );
    }

    for (const h of handles) {
      if (Math.hypot(px - h.x, py - h.y) <= hitR) {
        return { handle: h.id, cx: box.cx, cy: box.cy };
      }
    }
    return null;
  };

  const hitTestObjects = (
    px: number,
    py: number,
    ctx: CanvasRenderingContext2D
  ): { target: NonNullable<SelectedObject>; cx: number; cy: number } | null => {
    // 1. Stickers top-to-bottom
    for (let i = design.stickers.length - 1; i >= 0; i--) {
      const s = design.stickers[i];
      const sBox = getStickerBox(spec.width, spec.height, s);
      const dx = px - sBox.cx;
      const dy = py - sBox.cy;
      const rad = (-sBox.rotation * Math.PI) / 180;
      const lx = dx * Math.cos(rad) - dy * Math.sin(rad);
      const ly = dx * Math.sin(rad) + dy * Math.cos(rad);
      if (Math.abs(lx) <= sBox.half && Math.abs(ly) <= sBox.half) {
        return { target: { type: 'sticker', uid: s.uid }, cx: sBox.cx, cy: sBox.cy };
      }
    }

    // 2. Typography Block
    const typoBox = getTypographyLayout(ctx, spec.width, spec.height, design, elapsedRef.current).box;
    if (
      px >= typoBox.x &&
      px <= typoBox.x + typoBox.w &&
      py >= typoBox.y &&
      py <= typoBox.y + typoBox.h
    ) {
      return { target: { type: 'text' }, cx: typoBox.cx, cy: typoBox.cy };
    }

    // 3. Collage Block
    if (design.collage.layout !== 'none') {
      const cBox = getCollageBox(spec.width, spec.height, design.collage);
      if (px >= cBox.x && px <= cBox.x + cBox.w && py >= cBox.y && py <= cBox.y + cBox.h) {
        return { target: { type: 'collage' }, cx: cBox.cx, cy: cBox.cy };
      }
    }

    return null;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const { px, py } = getCanvasPoint(e);

    // Priority 1: Handle on currently selected object
    const hitHandle = hitTestSelectedHandles(px, py, ctx);
    if (hitHandle && selectedObject) {
      if (hitHandle.handle === 'rotate' && selectedObject.type === 'sticker') {
        interactionRef.current = {
          kind: 'rotate',
          uid: selectedObject.uid,
          cx: hitHandle.cx,
          cy: hitHandle.cy,
        };
      } else {
        const sticker =
          selectedObject.type === 'sticker'
            ? design.stickers.find((s) => s.uid === selectedObject.uid)
            : null;
        interactionRef.current = {
          kind: 'resize',
          target: selectedObject,
          handle: hitHandle.handle,
          cx: hitHandle.cx,
          cy: hitHandle.cy,
          initDist: Math.max(12, Math.hypot(px - hitHandle.cx, py - hitHandle.cy)),
          initScale: sticker ? sticker.scale : 1,
          initHeadlineSize: design.text.headlineSize,
          initBodySize: design.text.bodySize,
        };
      }
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }

    // Priority 2: Hit an object body
    const hitObj = hitTestObjects(px, py, ctx);
    if (hitObj) {
      onSelectObject(hitObj.target);
      interactionRef.current = {
        kind: 'move',
        target: hitObj.target,
        offsetX: px - hitObj.cx,
        offsetY: py - hitObj.cy,
      };
      setHoverCursor('grabbing');
      e.currentTarget.setPointerCapture(e.pointerId);
      return;
    }

    onSelectObject(null);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const { px, py } = getCanvasPoint(e);
    const active = interactionRef.current;

    if (!active) {
      // Hover cursor feedback
      const hitHandle = hitTestSelectedHandles(px, py, ctx);
      if (hitHandle) {
        setHoverCursor(getCursorForHandle(hitHandle.handle));
        return;
      }
      const hitObj = hitTestObjects(px, py, ctx);
      setHoverCursor(hitObj ? 'grab' : 'default');
      return;
    }

    if (active.kind === 'move') {
      const nx = clamp((px - active.offsetX) / spec.width, 0.04, 0.96);
      const ny = clamp((py - active.offsetY) / spec.height, 0.04, 0.96);

      if (active.target.type === 'sticker') {
        const uid = active.target.uid;
        onUpdateDesign((prev) => ({
          ...prev,
          stickers: prev.stickers.map((s) => (s.uid === uid ? { ...s, x: nx, y: ny } : s)),
        }));
      } else if (active.target.type === 'text') {
        onUpdateDesign((prev) => ({
          ...prev,
          text: { ...prev.text, textX: nx, textY: ny },
        }));
      } else if (active.target.type === 'collage') {
        onUpdateDesign((prev) => ({
          ...prev,
          collage: { ...prev.collage, positionX: nx, positionY: ny },
        }));
      }
      return;
    }

    if (active.kind === 'rotate') {
      const angleRad = Math.atan2(py - active.cy, px - active.cx);
      const deg = Math.round(((angleRad * 180) / Math.PI + 90 + 360) % 360);
      const normalizedDeg = deg > 180 ? deg - 360 : deg;
      onUpdateDesign((prev) => ({
        ...prev,
        stickers: prev.stickers.map((s) =>
          s.uid === active.uid ? { ...s, rotation: normalizedDeg } : s
        ),
      }));
      return;
    }

    if (active.kind === 'resize') {
      if (active.target.type === 'sticker') {
        const uid = active.target.uid;
        const curDist = Math.max(10, Math.hypot(px - active.cx, py - active.cy));
        const nextScale = clamp(
          Number((active.initScale * (curDist / active.initDist)).toFixed(2)),
          0.35,
          3.0
        );
        onUpdateDesign((prev) => ({
          ...prev,
          stickers: prev.stickers.map((s) => (s.uid === uid ? { ...s, scale: nextScale } : s)),
        }));
      } else if (active.target.type === 'text') {
        if (active.handle === 'w' || active.handle === 'e') {
          const nextW = clamp(
            Number(((Math.abs(px - active.cx) * 2) / spec.width).toFixed(2)),
            0.34,
            0.95
          );
          onUpdateDesign((prev) => ({
            ...prev,
            text: { ...prev.text, textWidthScale: nextW },
          }));
        } else {
          const curDist = Math.max(20, Math.hypot(px - active.cx, py - active.cy));
          const ratio = curDist / active.initDist;
          const nextHead = Math.round(clamp(active.initHeadlineSize * ratio, 26, 136));
          const nextBody = Math.round(clamp(active.initBodySize * ratio, 14, 58));
          onUpdateDesign((prev) => ({
            ...prev,
            text: { ...prev.text, headlineSize: nextHead, bodySize: nextBody },
          }));
        }
      } else if (active.target.type === 'collage') {
        const nextW =
          active.handle === 'n' || active.handle === 's'
            ? undefined
            : clamp(Number(((Math.abs(px - active.cx) * 2) / spec.width).toFixed(2)), 0.26, 0.96);
        const nextH =
          active.handle === 'w' || active.handle === 'e'
            ? undefined
            : clamp(
                Number(((Math.abs(py - active.cy) * 2) / spec.height).toFixed(2)),
                0.16,
                0.88
              );
        onUpdateDesign((prev) => ({
          ...prev,
          collage: {
            ...prev.collage,
            ...(nextW !== undefined ? { widthScale: nextW } : {}),
            ...(nextH !== undefined ? { heightScale: nextH } : {}),
          },
        }));
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (interactionRef.current) {
      interactionRef.current = null;
      setHoverCursor('grab');
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    }
  };

  const secondsStr = (elapsedMs / 1000).toFixed(1);

  const selectionLabel =
    selectedObject?.type === 'sticker'
      ? 'Đang chọn: Sticker'
      : selectedObject?.type === 'text'
      ? 'Đang chọn: Cụm chữ lời chúc'
      : selectedObject?.type === 'collage'
      ? 'Đang chọn: Khung cắt ghép ảnh'
      : null;

  const handleCenterSelected = () => {
    if (selectedObject?.type === 'text') {
      onUpdateDesign((prev) => ({
        ...prev,
        text: { ...prev.text, textX: 0.5 },
      }));
    } else if (selectedObject?.type === 'collage') {
      onUpdateDesign((prev) => ({
        ...prev,
        collage: { ...prev.collage, positionX: 0.5 },
      }));
    }
  };

  const handleDeleteSelectedSticker = () => {
    if (selectedObject?.type !== 'sticker') return;
    const uid = selectedObject.uid;
    onUpdateDesign((prev) => ({
      ...prev,
      stickers: prev.stickers.filter((s) => s.uid !== uid),
    }));
    onSelectObject(null);
  };

  return (
    <section
      className={`order-1 lg:order-2 flex flex-col min-w-0 bg-[#0B0C10] shrink-0 lg:shrink lg:flex-1 transition-[height] duration-200 ${
        mobileExpanded ? 'h-[62dvh]' : 'h-[42dvh]'
      } lg:h-auto`}
    >
      {/* Workspace sub-toolbar */}
      <div className="h-11 lg:h-12 border-b border-[#1E212B] px-3 sm:px-5 flex items-center justify-between gap-2 sm:gap-4 shrink-0">
        {/* Aspect Ratio Selector */}
        <div className="flex items-center gap-0.5 sm:gap-1 p-0.5 sm:p-1 bg-[#14171F] border border-[#232734] rounded-lg">
          {ASPECT_RATIOS.map((ratio) => (
            <button
              key={ratio.id}
              type="button"
              onClick={() => onChangeAspectRatio(ratio.id)}
              className={`px-2 sm:px-3 py-1 text-[11px] sm:text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                design.aspectRatio === ratio.id
                  ? 'bg-[#262B38] text-[#F4F5F7]'
                  : 'text-[#9CA3AF] hover:text-[#F4F5F7]'
              }`}
            >
              <span className="sm:hidden">{ratio.id}</span>
              <span className="hidden sm:inline">{ratio.label}</span>
            </button>
          ))}
        </div>

        {/* Playback & Real-time Preview Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <span className="hidden md:inline-block text-xs font-mono tabular-nums text-[#8B92A5] mr-1">
            {secondsStr}s
          </span>
          <button
            type="button"
            onClick={() => setIsPlaying((p) => !p)}
            aria-label={isPlaying ? 'Tạm dừng' : 'Phát'}
            className="inline-flex items-center justify-center gap-1.5 p-2 sm:px-3 sm:py-1.5 text-xs font-medium text-[#E5E7EB] bg-[#161922] hover:bg-[#222634] border border-[#262A36] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isPlaying ? 'Tạm dừng' : 'Phát'}</span>
          </button>
          <button
            type="button"
            onClick={handleReplay}
            aria-label="Phát lại hiệu ứng"
            title="Phát lại hiệu ứng từ đầu"
            className="inline-flex items-center justify-center gap-1.5 p-2 sm:px-3 sm:py-1.5 text-xs font-medium text-[#E5E7EB] bg-[#161922] hover:bg-[#222634] border border-[#262A36] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Phát lại</span>
          </button>
          <button
            type="button"
            onClick={onOpenPreview}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-medium text-[#F4F5F7] bg-[#1E2330] hover:bg-[#2B3142] border border-[#32384A] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-[#FBBF24]" />
            <span className="sm:hidden">Xem</span>
            <span className="hidden sm:inline">Xem trước Story</span>
          </button>
          {onToggleMobileExpand && (
            <button
              type="button"
              onClick={onToggleMobileExpand}
              aria-label={mobileExpanded ? 'Thu gọn khung xem' : 'Mở rộng khung xem'}
              title={mobileExpanded ? 'Thu gọn khung xem' : 'Mở rộng khung xem'}
              className="lg:hidden inline-flex items-center justify-center p-2 text-xs font-medium text-[#E5E7EB] bg-[#161922] hover:bg-[#222634] border border-[#262A36] rounded-lg transition-colors shrink-0 cursor-pointer"
            >
              {mobileExpanded ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Main Canvas Viewport */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center px-3 py-2 sm:p-4 lg:p-6 overflow-hidden relative">
        <div className="relative flex-1 min-h-0 flex items-center justify-center w-full lg:max-h-[calc(100vh-148px)]">
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={() => {
              if (!interactionRef.current) setHoverCursor('default');
            }}
            style={{
              aspectRatio: `${spec.width} / ${spec.height}`,
              cursor: hoverCursor,
            }}
            className="max-h-full max-w-full w-auto h-auto rounded-xl shadow-[0_16px_45px_rgba(0,0,0,0.65)] border border-[#262A36] touch-none"
          />
        </div>

        <div className="mt-1.5 lg:mt-3 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-[11px] sm:text-xs text-[#7D8597] text-center shrink-0">
          <span className="sm:hidden truncate max-w-[260px]">
            {selectionLabel ? selectionLabel : 'Chạm & kéo chữ, ảnh, sticker trên thiệp'}
          </span>
          <span className="hidden sm:inline">
            {spec.subtitle} · Kéo chữ, khung ảnh hoặc sticker để di chuyển và kéo các điểm viền để đổi kích thước
          </span>
          {selectionLabel && (
            <span className="inline-flex items-center gap-2 text-[#38BDF8] font-medium">
              <span className="hidden sm:inline" aria-hidden="true">·</span>
              <span className="hidden sm:inline">{selectionLabel}</span>
              {(selectedObject?.type === 'text' || selectedObject?.type === 'collage') && (
                <button
                  type="button"
                  onClick={handleCenterSelected}
                  className="text-[#FBBF24] hover:underline cursor-pointer whitespace-nowrap"
                >
                  Căn giữa
                </button>
              )}
              {selectedObject?.type === 'sticker' && (
                <button
                  type="button"
                  onClick={handleDeleteSelectedSticker}
                  className="inline-flex items-center gap-1 text-[#FB7185] hover:underline cursor-pointer whitespace-nowrap"
                >
                  <Trash2 className="w-3 h-3" />
                  Xóa
                </button>
              )}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
