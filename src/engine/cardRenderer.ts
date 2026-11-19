import {
  CardDesignState,
  CollageConfig,
  CollageLayoutId,
  PhotoSlot,
  PlacedSticker,
  SelectedObject,
} from '../types/studio';
import { ParticleEngine } from './particleEngine';
import { drawStickerArtwork } from './stickerRenderer';

const imageCache = new Map<string, HTMLImageElement>();

export function getCachedImage(url: string | null): HTMLImageElement | null {
  if (!url) return null;
  const cached = imageCache.get(url);
  if (cached) {
    return cached.complete && cached.naturalWidth > 0 ? cached : null;
  }
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = url;
  imageCache.set(url, img);
  return null;
}

export function preloadImages(urls: Array<string | null>) {
  for (const url of urls) {
    if (url) getCachedImage(url);
  }
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

function getCollageSlotRects(
  layout: CollageLayoutId,
  boxX: number,
  boxY: number,
  boxW: number,
  boxH: number,
  gap: number
): Rect[] {
  switch (layout) {
    case 'single':
      return [{ x: boxX, y: boxY, w: boxW, h: boxH }];
    case 'split-h': {
      const w = (boxW - gap) / 2;
      return [
        { x: boxX, y: boxY, w, h: boxH },
        { x: boxX + w + gap, y: boxY, w, h: boxH },
      ];
    }
    case 'split-v': {
      const h = (boxH - gap) / 2;
      return [
        { x: boxX, y: boxY, w: boxW, h },
        { x: boxX, y: boxY + h + gap, w: boxW, h },
      ];
    }
    case 'grid-3': {
      const leftW = (boxW - gap) * 0.54;
      const rightW = boxW - gap - leftW;
      const rightH = (boxH - gap) / 2;
      return [
        { x: boxX, y: boxY, w: leftW, h: boxH },
        { x: boxX + leftW + gap, y: boxY, w: rightW, h: rightH },
        { x: boxX + leftW + gap, y: boxY + rightH + gap, w: rightW, h: rightH },
      ];
    }
    case 'grid-4': {
      const w = (boxW - gap) / 2;
      const h = (boxH - gap) / 2;
      return [
        { x: boxX, y: boxY, w, h },
        { x: boxX + w + gap, y: boxY, w, h },
        { x: boxX, y: boxY + h + gap, w, h },
        { x: boxX + w + gap, y: boxY + h + gap, w, h },
      ];
    }
    default:
      return [];
  }
}

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  rect: Rect,
  slot: PhotoSlot
) {
  const imgRatio = img.naturalWidth / img.naturalHeight;
  const rectRatio = rect.w / rect.h;

  let drawW: number;
  let drawH: number;
  if (imgRatio > rectRatio) {
    drawH = rect.h;
    drawW = drawH * imgRatio;
  } else {
    drawW = rect.w;
    drawH = drawW / imgRatio;
  }

  const zoom = Math.max(1, slot.zoom);
  drawW *= zoom;
  drawH *= zoom;

  const maxOffsetX = Math.max(0, (drawW - rect.w) / 2);
  const maxOffsetY = Math.max(0, (drawH - rect.h) / 2);
  const offsetX = slot.cropX * maxOffsetX;
  const offsetY = slot.cropY * maxOffsetY;

  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;

  ctx.save();
  ctx.translate(cx, cy);
  if (slot.rotation !== 0) {
    ctx.rotate((slot.rotation * Math.PI) / 180);
  }
  ctx.drawImage(img, -drawW / 2 + offsetX, -drawH / 2 + offsetY, drawW, drawH);
  ctx.restore();
}

function wrapTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  if (!text.trim()) return [];
  const paragraphs = text.split('\n');
  const lines: string[] = [];

  for (const para of paragraphs) {
    if (para.trim() === '') {
      lines.push('');
      continue;
    }
    const words = para.trim().split(/\s+/);
    let current = '';
    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
  }
  return lines;
}

export type GizmoHandleId = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'w' | 'e' | 'rotate';

export interface ObjectBox {
  x: number;
  y: number;
  w: number;
  h: number;
  cx: number;
  cy: number;
}

export function getCollageBox(width: number, height: number, collage: CollageConfig): ObjectBox {
  const boxW = width * (collage.widthScale ?? 0.82);
  const boxH = height * (collage.heightScale ?? 0.36);
  const cx = width * (collage.positionX ?? 0.5);
  const cy = height * (collage.positionY ?? 0.65);
  const boxX = cx - boxW / 2;
  const boxY = cy - boxH / 2;
  return { x: boxX, y: boxY, w: boxW, h: boxH, cx, cy };
}

export function getStickerBox(width: number, height: number, sticker: PlacedSticker) {
  const scaleFactor = width / 720;
  const cx = sticker.x * width;
  const cy = sticker.y * height;
  const size = 96 * scaleFactor * sticker.scale;
  const half = size * 0.56;
  return {
    cx,
    cy,
    size,
    half,
    rotation: sticker.rotation,
    x: cx - half,
    y: cy - half,
    w: half * 2,
    h: half * 2,
  };
}

export function getTypographyLayout(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: CardDesignState,
  elapsedMs = 2000
) {
  const scale = width / 720;
  const t = state.text;
  const maxTextWidth = width * (t.textWidthScale ?? 0.82);
  const centerX = width * (t.textX ?? 0.5);
  const boxLeft = centerX - maxTextWidth / 2;
  const xAnchor =
    t.align === 'left' ? boxLeft : t.align === 'right' ? boxLeft + maxTextWidth : centerX;

  const headlineText =
    t.animation === 'typewriter'
      ? t.headline.slice(0, Math.max(1, Math.floor(t.headline.length * Math.min(1, elapsedMs / 1100))))
      : t.headline;

  const bodyText =
    t.animation === 'typewriter'
      ? t.body.slice(
          0,
          Math.floor(t.body.length * Math.max(0, Math.min(1, (elapsedMs - 700) / 1600)))
        )
      : t.body;

  const kickerSize = 15 * scale;
  const headSize = t.headlineSize * scale * 0.76;
  const bodySize = t.bodySize * scale * 0.76;
  const sigSize = Math.max(16, t.bodySize * 0.82) * scale * 0.76;

  ctx.save();
  ctx.font = `600 ${kickerSize}px "Plus Jakarta Sans", sans-serif`;
  const kickerLines = t.kicker.trim() ? wrapTextLines(ctx, t.kicker, maxTextWidth) : [];

  ctx.font = `700 ${headSize}px ${t.headlineFont}`;
  const headLines = wrapTextLines(ctx, headlineText, maxTextWidth);

  ctx.font = `400 ${bodySize}px ${t.bodyFont}`;
  const bodyLines = wrapTextLines(ctx, bodyText, maxTextWidth);

  ctx.font = `600 ${sigSize}px ${t.bodyFont}`;
  const sigLines = t.signature.trim()
    ? wrapTextLines(ctx, `— ${t.signature}`, maxTextWidth)
    : [];
  ctx.restore();

  const kickerLineH = kickerSize * 1.35;
  const headLineH = headSize * 1.18;
  const bodyLineH = bodySize * 1.48;
  const sigLineH = sigSize * 1.35;

  const totalBlockH =
    (kickerLines.length ? kickerLines.length * kickerLineH + 10 * scale : 0) +
    headLines.length * headLineH +
    (bodyLines.length ? 12 * scale + bodyLines.length * bodyLineH : 0) +
    (sigLines.length ? 16 * scale + sigLines.length * sigLineH : 0);

  const minBlockH = Math.max(totalBlockH, 40 * scale);
  const startY = Math.max(
    14 * scale,
    Math.min(height - minBlockH - 14 * scale, height * t.textY - minBlockH / 2)
  );

  const padX = 14 * scale;
  const padY = 10 * scale;

  return {
    scale,
    centerX,
    xAnchor,
    maxTextWidth,
    startY,
    totalBlockH: minBlockH,
    kickerLines,
    headLines,
    bodyLines,
    sigLines,
    kickerSize,
    headSize,
    bodySize,
    sigSize,
    kickerLineH,
    headLineH,
    bodyLineH,
    sigLineH,
    box: {
      x: boxLeft - padX,
      y: startY - padY,
      w: maxTextWidth + padX * 2,
      h: minBlockH + padY * 2,
      cx: centerX,
      cy: startY + minBlockH / 2,
    },
  };
}

function drawSelectionBox(
  ctx: CanvasRenderingContext2D,
  box: ObjectBox,
  scale: number,
  options: { corners?: boolean; horizontalSides?: boolean; verticalSides?: boolean; rotate?: boolean }
) {
  ctx.save();
  ctx.strokeStyle = '#38BDF8';
  ctx.lineWidth = 2 * scale;
  ctx.setLineDash([6 * scale, 4 * scale]);
  ctx.strokeRect(box.x, box.y, box.w, box.h);
  ctx.setLineDash([]);

  const handleR = 5.5 * scale;
  const drawCircleHandle = (hx: number, hy: number, fill = '#FFFFFF') => {
    ctx.beginPath();
    ctx.arc(hx, hy, handleR, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.lineWidth = 2 * scale;
    ctx.strokeStyle = '#0284C7';
    ctx.stroke();
  };

  if (options.corners) {
    drawCircleHandle(box.x, box.y);
    drawCircleHandle(box.x + box.w, box.y);
    drawCircleHandle(box.x, box.y + box.h);
    drawCircleHandle(box.x + box.w, box.y + box.h);
  }

  if (options.horizontalSides) {
    const pillW = 5 * scale;
    const pillH = 18 * scale;
    for (const sx of [box.x, box.x + box.w]) {
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#0284C7';
      ctx.lineWidth = 1.8 * scale;
      ctx.beginPath();
      ctx.roundRect(sx - pillW / 2, box.cy - pillH / 2, pillW, pillH, 3 * scale);
      ctx.fill();
      ctx.stroke();
    }
  }

  if (options.verticalSides) {
    const pillW = 18 * scale;
    const pillH = 5 * scale;
    for (const sy of [box.y, box.y + box.h]) {
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#0284C7';
      ctx.lineWidth = 1.8 * scale;
      ctx.beginPath();
      ctx.roundRect(box.cx - pillW / 2, sy - pillH / 2, pillW, pillH, 3 * scale);
      ctx.fill();
      ctx.stroke();
    }
  }

  if (options.rotate) {
    const stemTop = box.y - 22 * scale;
    ctx.beginPath();
    ctx.moveTo(box.cx, box.y);
    ctx.lineTo(box.cx, stemTop);
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 1.8 * scale;
    ctx.stroke();
    drawCircleHandle(box.cx, stemTop, '#FDE68A');
  }

  ctx.restore();
}

export interface RenderOptions {
  elapsedMs: number;
  selectedObject?: SelectedObject;
  selectedStickerUid?: string | null;
  showGuides?: boolean;
  dtFactor?: number;
}

export function renderCardFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: CardDesignState,
  particles: ParticleEngine,
  options: RenderOptions
) {
  const { elapsedMs, selectedObject, selectedStickerUid, dtFactor = 1 } = options;
  const activeSelection: SelectedObject =
    selectedObject !== undefined
      ? selectedObject
      : selectedStickerUid
      ? { type: 'sticker', uid: selectedStickerUid }
      : null;

  // 1. Background Gradient
  const angleRad = ((state.bgGradientAngle - 90) * Math.PI) / 180;
  const cx = width / 2;
  const cy = height / 2;
  const r = Math.hypot(width, height) / 2;
  const grad = ctx.createLinearGradient(
    cx - Math.cos(angleRad) * r,
    cy - Math.sin(angleRad) * r,
    cx + Math.cos(angleRad) * r,
    cy + Math.sin(angleRad) * r
  );
  grad.addColorStop(0, state.bgGradientStart);
  grad.addColorStop(1, state.bgGradientEnd);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // 2. Optional Background Photo + Artistic Filter
  if (state.bgType === 'image' && state.bgImageUrl) {
    const bgImg = getCachedImage(state.bgImageUrl);
    if (bgImg) {
      ctx.save();
      ctx.globalAlpha = state.bgImageOpacity;
      const f = state.filter;
      ctx.filter = `brightness(${f.brightness}%) contrast(${f.contrast}%) saturate(${f.saturate}%) sepia(${f.sepia}%) hue-rotate(${f.hueRotate}deg)`;
      drawCoverImage(
        ctx,
        bgImg,
        { x: 0, y: 0, w: width, h: height },
        { id: 'bg', imageUrl: state.bgImageUrl, cropX: 0, cropY: 0, zoom: 1, rotation: 0 }
      );
      ctx.restore();
    }
  }

  // Background Scrim for guaranteed legibility
  if (state.bgScrimOpacity > 0) {
    const scrimGrad = ctx.createLinearGradient(0, 0, 0, height);
    scrimGrad.addColorStop(0, `rgba(8, 9, 13, ${state.bgScrimOpacity * 0.95})`);
    scrimGrad.addColorStop(0.5, `rgba(8, 9, 13, ${state.bgScrimOpacity * 0.55})`);
    scrimGrad.addColorStop(1, `rgba(8, 9, 13, ${state.bgScrimOpacity * 0.9})`);
    ctx.fillStyle = scrimGrad;
    ctx.fillRect(0, 0, width, height);
  }

  // 3. Particle Effects (under collage/text or behind frame for depth)
  particles.resize(width, height);
  particles.updateAndDraw(ctx, state.effect, dtFactor);

  // 4. Photo Collage Layer with Artistic Filter & Vignette
  const scaleFactor = width / 720;
  let collageBox: ObjectBox | null = null;
  if (state.collage.layout !== 'none') {
    collageBox = getCollageBox(width, height, state.collage);
    const { x: boxX, y: boxY, w: boxW, h: boxH } = collageBox;
    const gap = state.collage.gap * scaleFactor;
    const radius = state.collage.radius * scaleFactor;

    const rects = getCollageSlotRects(state.collage.layout, boxX, boxY, boxW, boxH, gap);
    const f = state.filter;

    rects.forEach((rect, idx) => {
      const slot = state.collage.slots[idx] || state.collage.slots[0];
      ctx.save();

      // Polaroid / border backdrop shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
      ctx.shadowBlur = 22 * scaleFactor;
      ctx.shadowOffsetY = 8 * scaleFactor;
      ctx.fillStyle = '#181A20';
      ctx.beginPath();
      ctx.roundRect(rect.x, rect.y, rect.w, rect.h, radius);
      ctx.fill();
      ctx.restore();

      // Clipped photo + color filter
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(rect.x, rect.y, rect.w, rect.h, radius);
      ctx.clip();

      const img = slot ? getCachedImage(slot.imageUrl) : null;
      if (img && slot) {
        ctx.filter = `brightness(${f.brightness}%) contrast(${f.contrast}%) saturate(${f.saturate}%) sepia(${f.sepia}%) hue-rotate(${f.hueRotate}deg)`;
        drawCoverImage(ctx, img, rect, slot);
        ctx.filter = 'none';
      } else {
        ctx.fillStyle = '#1F232E';
        ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
        ctx.fillStyle = '#64748B';
        ctx.font = `500 ${Math.round(16 * scaleFactor)}px "Plus Jakarta Sans", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`Khung ảnh ${idx + 1}`, rect.x + rect.w / 2, rect.y + rect.h / 2);
      }

      // Color tint overlay
      if (f.tintColor && f.tintOpacity) {
        ctx.fillStyle = f.tintColor;
        ctx.globalAlpha = f.tintOpacity;
        ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
        ctx.globalAlpha = 1;
      }

      // Vignette inside photo
      if (f.vignette > 0) {
        const vig = ctx.createRadialGradient(
          rect.x + rect.w / 2,
          rect.y + rect.h / 2,
          Math.min(rect.w, rect.h) * 0.25,
          rect.x + rect.w / 2,
          rect.y + rect.h / 2,
          Math.max(rect.w, rect.h) * 0.75
        );
        vig.addColorStop(0, 'rgba(0,0,0,0)');
        vig.addColorStop(1, `rgba(0,0,0,${(f.vignette / 100) * 0.72})`);
        ctx.fillStyle = vig;
        ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      }

      ctx.restore();

      // Photo slot border
      if (state.collage.borderWidth > 0) {
        ctx.save();
        ctx.strokeStyle = state.collage.borderColor;
        ctx.lineWidth = state.collage.borderWidth * scaleFactor;
        ctx.beginPath();
        ctx.roundRect(rect.x, rect.y, rect.w, rect.h, radius);
        ctx.stroke();
        ctx.restore();
      }
    });
  }

  // 5. Film Grain (lightweight deterministic dots if grain > 0)
  if (state.filter.grain > 0) {
    ctx.save();
    ctx.globalAlpha = (state.filter.grain / 100) * 0.08;
    ctx.fillStyle = '#FFFFFF';
    const grainCount = Math.floor((state.filter.grain / 100) * 420);
    for (let g = 0; g < grainCount; g++) {
      const gx = ((g * 9301 + 49297 + Math.floor(elapsedMs * 0.03)) % 233280) / 233280;
      const gy = ((g * 4391 + 19283 + Math.floor(elapsedMs * 0.07)) % 233280) / 233280;
      ctx.fillRect(gx * width, gy * height, 1.5, 1.5);
    }
    ctx.restore();
  }

  // 6. Decorative Frame Layer
  drawFrame(ctx, width, height, state.frameStyle, state.frameColor, scaleFactor);

  // 7. Stickers Layer
  for (const sticker of state.stickers) {
    const sBox = getStickerBox(width, height, sticker);

    ctx.save();
    ctx.translate(sBox.cx, sBox.cy);
    ctx.rotate((sBox.rotation * Math.PI) / 180);
    ctx.globalAlpha = sticker.opacity;
    drawStickerArtwork(ctx, sticker.stickerId, sBox.size, sticker.tint);

    if (activeSelection?.type === 'sticker' && activeSelection.uid === sticker.uid) {
      ctx.globalAlpha = 1;
      drawSelectionBox(
        ctx,
        {
          x: -sBox.half,
          y: -sBox.half,
          w: sBox.half * 2,
          h: sBox.half * 2,
          cx: 0,
          cy: 0,
        },
        scaleFactor,
        { corners: true, rotate: true }
      );
    }
    ctx.restore();
  }

  // 8. Typography Layer (with entrance animation)
  const typoBox = drawTypography(ctx, width, height, state, elapsedMs, scaleFactor);

  // 9. Selection Gizmo for Collage or Typography on top of everything
  if (activeSelection?.type === 'collage' && collageBox) {
    drawSelectionBox(ctx, collageBox, scaleFactor, {
      corners: true,
      horizontalSides: true,
      verticalSides: true,
    });
  } else if (activeSelection?.type === 'text') {
    drawSelectionBox(ctx, typoBox, scaleFactor, {
      corners: true,
      horizontalSides: true,
    });
  }
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  frameStyle: CardDesignState['frameStyle'],
  color: string,
  scale: number
) {
  if (frameStyle === 'none') return;
  ctx.save();
  ctx.strokeStyle = color;

  const pad = 26 * scale;
  if (frameStyle === 'gold-double') {
    ctx.globalAlpha = 0.85;
    ctx.lineWidth = 2.2 * scale;
    ctx.strokeRect(pad, pad, width - pad * 2, height - pad * 2);
    ctx.globalAlpha = 0.45;
    ctx.lineWidth = 1.1 * scale;
    const pad2 = pad + 8 * scale;
    ctx.strokeRect(pad2, pad2, width - pad2 * 2, height - pad2 * 2);
  } else if (frameStyle === 'editorial-thin') {
    ctx.globalAlpha = 0.6;
    ctx.lineWidth = 1.5 * scale;
    ctx.strokeRect(pad, pad, width - pad * 2, height - pad * 2);
  } else if (frameStyle === 'polaroid') {
    ctx.globalAlpha = 0.92;
    ctx.lineWidth = 14 * scale;
    ctx.strokeRect(18 * scale, 18 * scale, width - 36 * scale, height - 36 * scale);
  } else if (frameStyle === 'festive-corners') {
    const cornerLen = 46 * scale;
    ctx.lineWidth = 3 * scale;
    ctx.globalAlpha = 0.9;
    const corners = [
      [pad, pad, 1, 1],
      [width - pad, pad, -1, 1],
      [pad, height - pad, 1, -1],
      [width - pad, height - pad, -1, -1],
    ];
    for (const [cx, cy, dx, dy] of corners) {
      ctx.beginPath();
      ctx.moveTo(cx, cy + dy * cornerLen);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx + dx * cornerLen, cy);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx + dx * 10 * scale, cy + dy * 10 * scale, 3 * scale, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }
  } else if (frameStyle === 'cyber-grid') {
    ctx.globalAlpha = 0.14;
    ctx.lineWidth = 1 * scale;
    const step = 48 * scale;
    for (let x = step; x < width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = step; y < height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.75;
    ctx.lineWidth = 2 * scale;
    ctx.strokeRect(pad, pad, width - pad * 2, height - pad * 2);
  }
  ctx.restore();
}

function drawTypography(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: CardDesignState,
  elapsedMs: number,
  scale: number
): ObjectBox {
  const t = state.text;
  const layout = getTypographyLayout(ctx, width, height, state, elapsedMs);

  // Animation progress (0 -> 1 over 1400ms)
  const animProgress = t.animation === 'none' ? 1 : Math.min(1, Math.max(0, elapsedMs / 1300));
  const eased = 1 - Math.pow(1 - animProgress, 3);

  let yOffsetAnim = 0;
  let alphaAnim = 1;
  let scaleAnim = 1;

  if (t.animation === 'fade-up') {
    yOffsetAnim = (1 - eased) * 28 * scale;
    alphaAnim = eased;
  } else if (t.animation === 'pop') {
    scaleAnim = 0.85 + 0.15 * eased;
    alphaAnim = eased;
  }

  ctx.save();
  ctx.globalAlpha = alphaAnim;
  ctx.textAlign = t.align;
  ctx.textBaseline = 'top';

  if (t.shadow) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.72)';
    ctx.shadowBlur = 16 * scale;
    ctx.shadowOffsetY = 3 * scale;
  }

  let curY = layout.startY + yOffsetAnim;

  if (scaleAnim !== 1) {
    const centerBlockY = layout.startY + layout.totalBlockH / 2;
    ctx.translate(layout.xAnchor, centerBlockY);
    ctx.scale(scaleAnim, scaleAnim);
    ctx.translate(-layout.xAnchor, -centerBlockY);
  }

  // Kicker
  if (layout.kickerLines.length > 0) {
    ctx.font = `600 ${layout.kickerSize}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = t.accentColor;
    for (const line of layout.kickerLines) {
      ctx.fillText(line, layout.xAnchor, curY);
      curY += layout.kickerLineH;
    }
    curY += 10 * scale;
  }

  // Headline
  ctx.font = `700 ${layout.headSize}px ${t.headlineFont}`;
  ctx.fillStyle = t.headlineColor;
  for (const line of layout.headLines) {
    ctx.fillText(line, layout.xAnchor, curY);
    curY += layout.headLineH;
  }

  // Body
  if (layout.bodyLines.length > 0) {
    curY += 12 * scale;
    ctx.font = `400 ${layout.bodySize}px ${t.bodyFont}`;
    ctx.fillStyle = t.bodyColor;
    for (const line of layout.bodyLines) {
      ctx.fillText(line, layout.xAnchor, curY);
      curY += layout.bodyLineH;
    }
  }

  // Signature
  if (layout.sigLines.length > 0) {
    curY += 16 * scale;
    ctx.font = `600 ${layout.sigSize}px ${t.bodyFont}`;
    ctx.fillStyle = t.accentColor;
    for (const line of layout.sigLines) {
      ctx.fillText(line, layout.xAnchor, curY);
      curY += layout.sigLineH;
    }
  }

  ctx.restore();
  return layout.box;
}
