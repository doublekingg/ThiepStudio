import { useEffect, useRef, useState } from 'react';
import { Maximize2, RotateCcw, Smartphone, X } from 'lucide-react';
import { ASPECT_RATIOS } from '../data/presets';
import { renderCardFrame } from '../engine/cardRenderer';
import { ParticleEngine } from '../engine/particleEngine';
import { CardDesignState } from '../types/studio';

interface LivePreviewModalProps {
  design: CardDesignState;
  onClose: () => void;
  onOpenExport: () => void;
}

export function LivePreviewModal({ design, onClose, onOpenExport }: LivePreviewModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<ParticleEngine | null>(null);
  const elapsedRef = useRef(0);
  const [progressPct, setProgressPct] = useState(0);
  const [viewMode, setViewMode] = useState<'story' | 'cinema'>('story');

  const spec = ASPECT_RATIOS.find((r) => r.id === design.aspectRatio) || ASPECT_RATIOS[0];

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = spec.width;
    canvas.height = spec.height;
    engineRef.current = new ParticleEngine(spec.width, spec.height);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let last = performance.now();
    elapsedRef.current = 0;

    const loop = (now: number) => {
      const delta = Math.min(48, now - last);
      last = now;
      elapsedRef.current += delta;

      // 10s Story loop indicator
      const loopCycle = (elapsedRef.current % 10000) / 100;
      setProgressPct(loopCycle);

      renderCardFrame(ctx, spec.width, spec.height, design, engineRef.current!, {
        elapsedMs: elapsedRef.current,
        selectedStickerUid: null,
        dtFactor: delta / 16.667,
      });

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [design, spec.width, spec.height]);

  const handleReplay = () => {
    elapsedRef.current = 0;
    engineRef.current?.reset();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#07080B]/95 backdrop-blur-md flex flex-col">
      {/* Top Preview Bar */}
      <div className="h-14 px-3 sm:px-6 border-b border-[#1E222C] flex items-center justify-between gap-2 sm:gap-4 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <span className="hidden md:inline text-sm font-semibold text-[#F4F5F7] whitespace-nowrap">
            Xem trước thời gian thực
          </span>
          <div className="flex items-center gap-1 p-1 bg-[#14171F] border border-[#242834] rounded-lg">
            <button
              type="button"
              onClick={() => setViewMode('story')}
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 text-xs font-medium rounded-md cursor-pointer whitespace-nowrap ${
                viewMode === 'story'
                  ? 'bg-[#282D3A] text-[#F4F5F7]'
                  : 'text-[#8B92A5] hover:text-[#F4F5F7]'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="sm:hidden">Story</span>
              <span className="hidden sm:inline">Khung Facebook Story</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cinema')}
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 text-xs font-medium rounded-md cursor-pointer whitespace-nowrap ${
                viewMode === 'cinema'
                  ? 'bg-[#282D3A] text-[#F4F5F7]'
                  : 'text-[#8B92A5] hover:text-[#F4F5F7]'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="sm:hidden">Đầy màn</span>
              <span className="hidden sm:inline">Toàn màn hình</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={handleReplay}
            aria-label="Phát lại"
            className="inline-flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 text-xs font-medium text-[#E5E7EB] bg-[#161922] hover:bg-[#222634] border border-[#262A36] rounded-lg cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Phát lại</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenExport();
            }}
            className="px-3 sm:px-4 py-1.5 text-xs font-semibold bg-[#E11D48] hover:bg-[#BE123C] text-white rounded-lg cursor-pointer whitespace-nowrap"
          >
            <span className="sm:hidden">Xuất</span>
            <span className="hidden sm:inline">Xuất Video Story</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng xem trước"
            className="p-2 rounded-lg text-[#9CA3AF] hover:text-white hover:bg-[#1E222C] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Preview Stage */}
      <div className="flex-1 min-h-0 flex items-center justify-center p-3 sm:p-6 overflow-hidden">
        {viewMode === 'story' ? (
          <div className="relative h-full max-h-[760px] aspect-[9/16] bg-black rounded-[34px] border-[6px] border-[#242834] shadow-[0_32px_90px_rgba(0,0,0,0.85)] overflow-hidden flex items-center justify-center">
            {/* Simulated Facebook Story Top UI Overlay */}
            <div className="absolute top-0 inset-x-0 z-10 p-3.5 bg-gradient-to-b from-black/70 via-black/30 to-transparent pointer-events-none">
              <div className="h-0.5 w-full bg-white/30 rounded-full overflow-hidden mb-3">
                <div
                  className="h-full bg-white transition-none"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#E11D48] to-[#FBBF24] flex items-center justify-center text-xs font-bold text-white">
                  CM
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-white leading-tight">Tin của bạn</p>
                  <p className="text-[10px] text-white/75">Vừa xong · Hiệu ứng trực tiếp</p>
                </div>
              </div>
            </div>

            <canvas
              ref={canvasRef}
              style={{ aspectRatio: `${spec.width} / ${spec.height}` }}
              className="max-w-full max-h-full w-auto h-auto object-contain"
            />

            {/* Simulated Facebook Story Bottom Reply Bar */}
            <div className="absolute bottom-0 inset-x-0 z-10 p-3.5 bg-gradient-to-t from-black/70 to-transparent pointer-events-none">
              <div className="px-4 py-2 rounded-full border border-white/30 text-[11px] text-white/75">
                Gửi tin nhắn chúc mừng...
              </div>
            </div>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            style={{ aspectRatio: `${spec.width} / ${spec.height}` }}
            className="max-h-full max-w-full w-auto h-auto rounded-xl shadow-2xl border border-[#262A36]"
          />
        )}
      </div>
    </div>
  );
}
