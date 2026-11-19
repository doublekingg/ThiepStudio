export type AspectRatioId = '9:16' | '1:1' | '4:3';

export type EffectType = 'fireworks' | 'binary' | 'confetti' | 'petals' | 'sparkles' | 'none';

export type EffectPaletteId = 'festive-gold' | 'crimson-tet' | 'cyber-emerald' | 'pastel-spring' | 'royal-sapphire';

export type CollageLayoutId = 'none' | 'single' | 'split-h' | 'split-v' | 'grid-3' | 'grid-4';

export type FrameStyleId = 'none' | 'gold-double' | 'editorial-thin' | 'polaroid' | 'festive-corners' | 'cyber-grid';

export type TextAnimationId = 'none' | 'fade-up' | 'typewriter' | 'pop';

export type ColorFilterId =
  | 'original'
  | 'vintage-warm'
  | 'cinematic'
  | 'festive-vivid'
  | 'noir'
  | 'soft-pastel'
  | 'golden-hour';

export type StudioTabId = 'templates' | 'effects' | 'typography' | 'stickers' | 'collage';

export interface AspectRatioSpec {
  id: AspectRatioId;
  label: string;
  subtitle: string;
  width: number;
  height: number;
}

export interface FontOption {
  id: string;
  name: string;
  family: string;
  category: 'Cổ điển' | 'Thư pháp' | 'Hiện đại' | 'Kỹ thuật';
  previewText: string;
}

export interface FilterPreset {
  id: ColorFilterId;
  name: string;
  description: string;
  brightness: number; // 50 - 150
  contrast: number; // 50 - 150
  saturate: number; // 0 - 200
  sepia: number; // 0 - 100
  hueRotate: number; // -180 to 180
  vignette: number; // 0 - 100
  grain: number; // 0 - 100
  tintColor?: string;
  tintOpacity?: number;
}

export interface PhotoSlot {
  id: string;
  imageUrl: string | null;
  cropX: number; // -1 to 1 normalized pan
  cropY: number; // -1 to 1 normalized pan
  zoom: number; // 1 to 3
  rotation: number; // degrees -45 to 45 or 90 steps
}

export interface CollageConfig {
  layout: CollageLayoutId;
  gap: number; // px on 1080 scale
  radius: number; // px on 1080 scale
  borderWidth: number;
  borderColor: string;
  positionX: number; // 0.1 to 0.9 horizontal center
  positionY: number; // 0.1 to 0.9 vertical center
  widthScale: number; // 0.28 to 0.96 fraction of canvas width
  heightScale: number; // 0.18 to 0.86 fraction of canvas height
  slots: PhotoSlot[];
}

export interface StickerDefinition {
  id: string;
  name: string;
  category: 'Tri ân Thầy Cô' | 'Năm Mới & Lễ Hội' | 'Trang Trí';
  defaultColor: string;
}

export interface PlacedSticker {
  uid: string;
  stickerId: string;
  x: number; // 0 to 1 normalized canvas coordinate
  y: number; // 0 to 1 normalized canvas coordinate
  scale: number; // 0.4 to 2.5
  rotation: number; // degrees -180 to 180
  opacity: number; // 0.1 to 1
  tint?: string;
}

export interface TextConfig {
  kicker: string;
  headline: string;
  body: string;
  signature: string;
  headlineFont: string;
  bodyFont: string;
  headlineSize: number; // px on 1080 base width
  bodySize: number;
  headlineColor: string;
  bodyColor: string;
  accentColor: string;
  align: 'left' | 'center' | 'right';
  textX: number; // 0.1 to 0.9 normalized horizontal center
  textY: number; // 0.1 to 0.9 normalized vertical center
  textWidthScale: number; // 0.35 to 0.95 fraction of canvas width
  shadow: boolean;
  animation: TextAnimationId;
}

export type SelectedObject =
  | { type: 'sticker'; uid: string }
  | { type: 'text' }
  | { type: 'collage' }
  | null;

export interface EffectConfig {
  type: EffectType;
  palette: EffectPaletteId;
  density: number; // 0.2 to 1.5
  speed: number; // 0.3 to 2.0
  glow: boolean;
  secondarySparkle: boolean;
}

export interface CardDesignState {
  templateId: string;
  occasion: 'teacher' | 'new-year' | 'celebration' | 'tech';
  aspectRatio: AspectRatioId;
  bgType: 'gradient' | 'image';
  bgGradientStart: string;
  bgGradientEnd: string;
  bgGradientAngle: number;
  bgImageUrl: string | null;
  bgImageOpacity: number;
  bgScrimOpacity: number;
  frameStyle: FrameStyleId;
  frameColor: string;
  effect: EffectConfig;
  text: TextConfig;
  collage: CollageConfig;
  filter: FilterPreset;
  stickers: PlacedSticker[];
}

export interface CardTemplate {
  id: string;
  name: string;
  occasion: 'teacher' | 'new-year' | 'celebration' | 'tech';
  occasionLabel: string;
  description: string;
  thumbnailUrl?: string;
  previewGradient: [string, string];
  state: Omit<CardDesignState, 'templateId'>;
}
