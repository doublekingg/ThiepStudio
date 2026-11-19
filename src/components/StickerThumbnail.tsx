import { useEffect, useRef } from 'react';
import { drawStickerArtwork } from '../engine/stickerRenderer';

interface StickerThumbnailProps {
  stickerId: string;
  size?: number;
}

export function StickerThumbnail({ stickerId, size = 48 }: StickerThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.translate(size / 2, size / 2);
    drawStickerArtwork(ctx, stickerId, size * 0.84);
    ctx.restore();
  }, [stickerId, size]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size }}
      className="pointer-events-none block mx-auto"
    />
  );
}
