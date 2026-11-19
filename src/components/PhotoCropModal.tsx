import React, { useEffect, useRef, useState } from 'react';
import { RotateCw, Upload, X, ZoomIn } from 'lucide-react';
import { PhotoSlot } from '../types/studio';

interface PhotoCropModalProps {
  slotIndex: number;
  slot: PhotoSlot;
  onSave: (updated: PhotoSlot) => void;
  onClose: () => void;
}

export function PhotoCropModal({ slotIndex, slot, onSave, onClose }: PhotoCropModalProps) {
  const [draft, setDraft] = useState<PhotoSlot>({ ...slot });
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const draggingRef = useRef<{ startX: number; startY: number; initCropX: number; initCropY: number } | null>(null);

  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = 420;
    const h = 320;
    canvas.width = w;
    canvas.height = h;

    ctx.fillStyle = '#0F1117';
    ctx.fillRect(0, 0, w, h);

    if (!draft.imageUrl) {
      ctx.fillStyle = '#6B7280';
      ctx.font = '500 14px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Chưa có ảnh — hãy tải ảnh lên', w / 2, h / 2);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.fillStyle = '#0F1117';
      ctx.fillRect(0, 0, w, h);

      const imgRatio = img.naturalWidth / img.naturalHeight;
      const rectRatio = w / h;
      let drawW: number;
      let drawH: number;
      if (imgRatio > rectRatio) {
        drawH = h;
        drawW = drawH * imgRatio;
      } else {
        drawW = w;
        drawH = drawW / imgRatio;
      }
      drawW *= draft.zoom;
      drawH *= draft.zoom;

      const maxOX = Math.max(0, (drawW - w) / 2);
      const maxOY = Math.max(0, (drawH - h) / 2);

      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.rotate((draft.rotation * Math.PI) / 180);
      ctx.drawImage(
        img,
        -drawW / 2 + draft.cropX * maxOX,
        -drawH / 2 + draft.cropY * maxOY,
        drawW,
        drawH
      );
      ctx.restore();

      // Rule of thirds subtle crop grid
      ctx.strokeStyle = 'rgba(255,255,255,0.22)';
      ctx.lineWidth = 1;
      for (let i = 1; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo((w * i) / 3, 0);
        ctx.lineTo((w * i) / 3, h);
        ctx.moveTo(0, (h * i) / 3);
        ctx.lineTo(w, (h * i) / 3);
        ctx.stroke();
      }
    };
    img.src = draft.imageUrl;
  }, [draft]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    draggingRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initCropX: draft.cropX,
      initCropY: draft.cropY,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!draggingRef.current) return;
    const dx = (e.clientX - draggingRef.current.startX) / 120;
    const dy = (e.clientY - draggingRef.current.startY) / 120;
    setDraft((prev) => ({
      ...prev,
      cropX: Math.max(-1, Math.min(1, draggingRef.current!.initCropX + dx)),
      cropY: Math.max(-1, Math.min(1, draggingRef.current!.initCropY + dy)),
    }));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    draggingRef.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setDraft((prev) => ({
          ...prev,
          imageUrl: reader.result as string,
          cropX: 0,
          cropY: 0,
          zoom: 1,
          rotation: 0,
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#14171F] border border-[#272B38] rounded-2xl overflow-hidden shadow-2xl">
        <div className="px-5 py-4 border-b border-[#242834] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#F4F5F7]">
              Cắt & Căn khung Ô ảnh {slotIndex + 1}
            </h3>
            <p className="text-xs text-[#8B92A5] mt-0.5">
              Kéo ảnh trực tiếp trong khung để căn vùng hiển thị đẹp nhất
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-white hover:bg-[#232734] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex justify-center">
            <canvas
              ref={previewCanvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="w-full max-w-[420px] rounded-xl border border-[#2B3040] cursor-move touch-none"
            />
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="inline-flex items-center gap-1.5 text-[#9CA3AF]">
                  <ZoomIn className="w-3.5 h-3.5" />
                  Thu phóng (Zoom)
                </span>
                <span className="font-mono tabular-nums text-[#D1D5DB]">
                  {draft.zoom.toFixed(2)}x
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={draft.zoom}
                onChange={(e) => setDraft((prev) => ({ ...prev, zoom: Number(e.target.value) }))}
                className="w-full studio-slider"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="inline-flex items-center gap-1.5 text-[#9CA3AF]">
                  <RotateCw className="w-3.5 h-3.5" />
                  Xoay ảnh
                </span>
                <span className="font-mono tabular-nums text-[#D1D5DB]">
                  {draft.rotation}°
                </span>
              </div>
              <input
                type="range"
                min={-45}
                max={45}
                step={1}
                value={draft.rotation}
                onChange={(e) => setDraft((prev) => ({ ...prev, rotation: Number(e.target.value) }))}
                className="w-full studio-slider"
              />
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-[#242834] flex items-center justify-between gap-3">
          <label className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-[#1E222E] hover:bg-[#282D3C] text-[#E5E7EB] rounded-lg cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            Chọn ảnh khác
            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </label>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setDraft((prev) => ({ ...prev, cropX: 0, cropY: 0, zoom: 1, rotation: 0 }))
              }
              className="px-3 py-2 text-xs font-medium text-[#9CA3AF] hover:text-white cursor-pointer"
            >
              Đặt lại
            </button>
            <button
              type="button"
              onClick={() => onSave(draft)}
              className="px-4 py-2 text-xs font-semibold bg-[#E11D48] hover:bg-[#BE123C] text-white rounded-lg cursor-pointer"
            >
              Áp dụng khung ảnh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
