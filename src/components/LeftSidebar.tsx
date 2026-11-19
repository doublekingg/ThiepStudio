import React, { useRef, useState } from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Crop,
  ImagePlus,
  Layers,
  Palette,
  SlidersHorizontal,
  Sparkles,
  Sticker,
  Trash2,
  Type,
  Upload,
} from 'lucide-react';
import {
  CARD_TEMPLATES,
  EFFECT_PALETTES,
  FILTER_PRESETS,
  FONT_LIBRARY,
  GENERATED_IMAGES,
  STICKER_LIBRARY,
} from '../data/presets';
import {
  CardDesignState,
  CardTemplate,
  CollageLayoutId,
  ColorFilterId,
  EffectPaletteId,
  EffectType,
  FrameStyleId,
  PlacedSticker,
  StudioTabId,
  TextAnimationId,
} from '../types/studio';
import { StickerThumbnail } from './StickerThumbnail';

interface LeftSidebarProps {
  activeTab: StudioTabId;
  onSelectTab: (tab: StudioTabId) => void;
  design: CardDesignState;
  onApplyTemplate: (template: CardTemplate) => void;
  onUpdateDesign: (updater: (prev: CardDesignState) => CardDesignState) => void;
  selectedStickerUid: string | null;
  onSelectSticker: (uid: string | null) => void;
  onOpenCropModal: (slotIndex: number) => void;
}

const TABS: Array<{ id: StudioTabId; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'templates', label: 'Mẫu', icon: Layers },
  { id: 'effects', label: 'Hiệu ứng', icon: Sparkles },
  { id: 'typography', label: 'Chữ & Font', icon: Type },
  { id: 'stickers', label: 'Sticker', icon: Sticker },
  { id: 'collage', label: 'Ảnh & Màu', icon: Crop },
];

const EFFECT_TYPES: Array<{ id: EffectType; label: string; desc: string }> = [
  { id: 'fireworks', label: 'Pháo hoa', desc: 'Pháo hoa nổ rực rỡ trên bầu trời đêm' },
  { id: 'binary', label: 'Chuỗi nhị phân', desc: 'Dòng số 0/1 rơi sáng phong cách công nghệ' },
  { id: 'confetti', label: 'Pháo giấy chúc mừng', desc: 'Ruy-băng & ngôi sao xoay 3D tung bay' },
  { id: 'petals', label: 'Cánh hoa rơi', desc: 'Cánh mai, hoa đào rơi nhẹ nhàng' },
  { id: 'sparkles', label: 'Ánh sao lấp lánh', desc: 'Hạt sáng bokeh lung linh ấm áp' },
  { id: 'none', label: 'Tắt hiệu ứng', desc: 'Hiển thị thiệp tĩnh không hạt động' },
];

const COLLAGE_LAYOUTS: Array<{ id: CollageLayoutId; label: string }> = [
  { id: 'none', label: 'Không ảnh' },
  { id: 'single', label: '1 Ảnh' },
  { id: 'split-h', label: '2 Ngang' },
  { id: 'split-v', label: '2 Dọc' },
  { id: 'grid-3', label: '3 Ảnh' },
  { id: 'grid-4', label: '4 Ảnh' },
];

const FRAME_STYLES: Array<{ id: FrameStyleId; label: string }> = [
  { id: 'none', label: 'Không khung' },
  { id: 'gold-double', label: 'Viền đôi' },
  { id: 'festive-corners', label: 'Góc lễ hội' },
  { id: 'editorial-thin', label: 'Tối giản' },
  { id: 'polaroid', label: 'Polaroid' },
  { id: 'cyber-grid', label: 'Lưới số' },
];

export function LeftSidebar({
  activeTab,
  onSelectTab,
  design,
  onApplyTemplate,
  onUpdateDesign,
  selectedStickerUid,
  onSelectSticker,
  onOpenCropModal,
}: LeftSidebarProps) {
  const [occasionFilter, setOccasionFilter] = useState<'all' | 'teacher' | 'new-year' | 'celebration' | 'tech'>('all');
  const [fontCategory, setFontCategory] = useState<'Tất cả' | 'Cổ điển' | 'Thư pháp' | 'Hiện đại' | 'Kỹ thuật'>('Tất cả');
  const [stickerCategory, setStickerCategory] = useState<'Tất cả' | 'Tri ân Thầy Cô' | 'Năm Mới & Lễ Hội' | 'Trang Trí'>('Tất cả');
  const bgUploadRef = useRef<HTMLInputElement | null>(null);

  const filteredTemplates =
    occasionFilter === 'all'
      ? CARD_TEMPLATES
      : CARD_TEMPLATES.filter((t) => t.occasion === occasionFilter);

  const filteredFonts =
    fontCategory === 'Tất cả'
      ? FONT_LIBRARY
      : FONT_LIBRARY.filter((f) => f.category === fontCategory);

  const filteredStickers =
    stickerCategory === 'Tất cả'
      ? STICKER_LIBRARY
      : STICKER_LIBRARY.filter((s) => s.category === stickerCategory);

  const selectedSticker = design.stickers.find((s) => s.uid === selectedStickerUid) || null;

  const activeSlotCount =
    design.collage.layout === 'none'
      ? 0
      : design.collage.layout === 'single'
      ? 1
      : design.collage.layout === 'split-h' || design.collage.layout === 'split-v'
      ? 2
      : design.collage.layout === 'grid-3'
      ? 3
      : 4;

  const handleUploadBg = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onUpdateDesign((prev) => ({
          ...prev,
          bgType: 'image',
          bgImageUrl: reader.result as string,
        }));
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleUploadSlotImage = (slotIdx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onUpdateDesign((prev) => {
          const nextSlots = [...prev.collage.slots];
          nextSlots[slotIdx] = {
            ...nextSlots[slotIdx],
            imageUrl: reader.result as string,
            cropX: 0,
            cropY: 0,
            zoom: 1,
            rotation: 0,
          };
          return {
            ...prev,
            collage: { ...prev.collage, slots: nextSlots },
          };
        });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAddSticker = (stickerId: string) => {
    const newSticker: PlacedSticker = {
      uid: `stk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      stickerId,
      x: 0.35 + Math.random() * 0.3,
      y: 0.35 + Math.random() * 0.3,
      scale: 1,
      rotation: 0,
      opacity: 1,
    };
    onUpdateDesign((prev) => ({
      ...prev,
      stickers: [...prev.stickers, newSticker],
    }));
    onSelectSticker(newSticker.uid);
  };

  const updateSelectedSticker = (patch: Partial<PlacedSticker>) => {
    if (!selectedStickerUid) return;
    onUpdateDesign((prev) => ({
      ...prev,
      stickers: prev.stickers.map((s) =>
        s.uid === selectedStickerUid ? { ...s, ...patch } : s
      ),
    }));
  };

  const removeSelectedSticker = () => {
    if (!selectedStickerUid) return;
    onUpdateDesign((prev) => ({
      ...prev,
      stickers: prev.stickers.filter((s) => s.uid !== selectedStickerUid),
    }));
    onSelectSticker(null);
  };

  return (
    <aside className="order-2 lg:order-1 flex-1 min-h-0 lg:flex-none w-full lg:w-[390px] xl:w-[410px] border-t lg:border-t-0 lg:border-r border-[#22252E] bg-[#101218] flex flex-col shrink-0 lg:h-[calc(100vh-56px)]">
      {/* Segmented Tool Tab Bar */}
      <div className="grid grid-cols-5 border-b border-[#22252E] bg-[#0D0F14] shrink-0">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`min-h-[46px] flex flex-col items-center justify-center gap-1 py-2 px-1 text-[11px] font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                active
                  ? 'border-[#E11D48] text-[#F4F5F7] bg-[#161922]'
                  : 'border-transparent text-[#8B92A5] hover:text-[#E5E7EB]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Scrollable Inspector Content */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-5 space-y-6">
        {/* TAB 1: TEMPLATES & BACKDROP */}
        {activeTab === 'templates' && (
          <>
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-[#F4F5F7]">Mẫu thiệp thiết kế sẵn</h2>
                <span className="text-xs text-[#8B92A5] tabular-nums">{filteredTemplates.length} mẫu</span>
              </div>

              <div className="flex flex-wrap gap-1 p-1 bg-[#161922] border border-[#242834] rounded-lg mb-4">
                {[
                  { id: 'all', label: 'Tất cả' },
                  { id: 'teacher', label: 'Thầy Cô' },
                  { id: 'new-year', label: 'Năm Mới' },
                  { id: 'tech', label: 'Nhị phân' },
                  { id: 'celebration', label: 'Vinh danh' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setOccasionFilter(opt.id as typeof occasionFilter)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      occasionFilter === opt.id
                        ? 'bg-[#282D3A] text-[#F4F5F7]'
                        : 'text-[#8B92A5] hover:text-[#F4F5F7]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {filteredTemplates.map((tpl) => {
                  const isCurrent = design.templateId === tpl.id;
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => onApplyTemplate(tpl)}
                      className={`group text-left rounded-xl overflow-hidden border transition-colors cursor-pointer bg-[#151821] ${
                        isCurrent
                          ? 'border-[#E11D48]'
                          : 'border-[#232734] hover:border-[#3A4054]'
                      }`}
                    >
                      <div
                        className="h-24 w-full relative overflow-hidden"
                        style={{
                          background: `linear-gradient(145deg, ${tpl.previewGradient[0]}, ${tpl.previewGradient[1]})`,
                        }}
                      >
                        {tpl.thumbnailUrl && (
                          <img
                            src={tpl.thumbnailUrl}
                            alt={tpl.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover opacity-75 group-hover:scale-105 transition-transform duration-300"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                        <span className="absolute bottom-2 left-2.5 right-2.5 text-[11px] font-medium text-[#FDE68A] truncate">
                          {tpl.occasionLabel}
                        </span>
                      </div>
                      <div className="p-2.5">
                        <p className="text-xs font-semibold text-[#F4F5F7] truncate">{tpl.name}</p>
                        <p className="text-[11px] text-[#8B92A5] line-clamp-2 mt-0.5 leading-relaxed">
                          {tpl.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-[#22252E] pt-5 space-y-4">
              <h3 className="text-sm font-semibold text-[#F4F5F7]">Nền & Khung viền</h3>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs text-[#9CA3AF] block mb-1.5">Màu nền 1</span>
                  <div className="flex items-center gap-2 bg-[#161922] border border-[#262A36] rounded-lg px-2.5 py-1.5">
                    <input
                      type="color"
                      value={design.bgGradientStart}
                      onChange={(e) =>
                        onUpdateDesign((prev) => ({ ...prev, bgGradientStart: e.target.value }))
                      }
                      className="w-5 h-5 rounded cursor-pointer bg-transparent border-0"
                    />
                    <span className="text-xs font-mono text-[#D1D5DB] uppercase">
                      {design.bgGradientStart}
                    </span>
                  </div>
                </label>

                <label className="block">
                  <span className="text-xs text-[#9CA3AF] block mb-1.5">Màu nền 2</span>
                  <div className="flex items-center gap-2 bg-[#161922] border border-[#262A36] rounded-lg px-2.5 py-1.5">
                    <input
                      type="color"
                      value={design.bgGradientEnd}
                      onChange={(e) =>
                        onUpdateDesign((prev) => ({ ...prev, bgGradientEnd: e.target.value }))
                      }
                      className="w-5 h-5 rounded cursor-pointer bg-transparent border-0"
                    />
                    <span className="text-xs font-mono text-[#D1D5DB] uppercase">
                      {design.bgGradientEnd}
                    </span>
                  </div>
                </label>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs text-[#9CA3AF] mb-1.5">
                  <span>Ảnh nền tùy chọn</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => bgUploadRef.current?.click()}
                      className="text-xs font-medium text-[#FBBF24] hover:underline cursor-pointer"
                    >
                      Tải ảnh lên
                    </button>
                    {design.bgImageUrl && (
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateDesign((prev) => ({ ...prev, bgType: 'gradient', bgImageUrl: null }))
                        }
                        className="text-xs text-[#8B92A5] hover:text-[#F43F5E] cursor-pointer"
                      >
                        Bỏ ảnh
                      </button>
                    )}
                  </div>
                </div>
                <input
                  ref={bgUploadRef}
                  type="file"
                  accept="image/*"
                  onChange={handleUploadBg}
                  className="hidden"
                />
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Hoa 20/11', url: GENERATED_IMAGES.teacherBouquet },
                    { label: 'Đèn lồng', url: GENERATED_IMAGES.tetLanterns },
                    { label: 'Pháo hoa', url: GENERATED_IMAGES.fireworksSky },
                    { label: 'Lớp học', url: GENERATED_IMAGES.classroomMemory },
                  ].map((bg) => (
                    <button
                      key={bg.label}
                      type="button"
                      onClick={() =>
                        onUpdateDesign((prev) => ({
                          ...prev,
                          bgType: 'image',
                          bgImageUrl: bg.url,
                        }))
                      }
                      className={`h-14 rounded-lg overflow-hidden border relative cursor-pointer ${
                        design.bgType === 'image' && design.bgImageUrl === bg.url
                          ? 'border-[#E11D48]'
                          : 'border-[#252936]'
                      }`}
                    >
                      <img
                        src={bg.url}
                        alt={bg.label}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>

              {design.bgType === 'image' && design.bgImageUrl && (
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#9CA3AF]">Độ rõ ảnh nền</span>
                    <span className="font-mono tabular-nums text-[#D1D5DB]">
                      {Math.round(design.bgImageOpacity * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.1}
                    max={1}
                    step={0.05}
                    value={design.bgImageOpacity}
                    onChange={(e) =>
                      onUpdateDesign((prev) => ({
                        ...prev,
                        bgImageOpacity: Number(e.target.value),
                      }))
                    }
                    className="w-full studio-slider"
                  />
                </div>
              )}

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#9CA3AF]">Lớp phủ tối bảo vệ chữ</span>
                  <span className="font-mono tabular-nums text-[#D1D5DB]">
                    {Math.round(design.bgScrimOpacity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={0.85}
                  step={0.05}
                  value={design.bgScrimOpacity}
                  onChange={(e) =>
                    onUpdateDesign((prev) => ({
                      ...prev,
                      bgScrimOpacity: Number(e.target.value),
                    }))
                  }
                  className="w-full studio-slider"
                />
              </div>

              <div>
                <span className="text-xs text-[#9CA3AF] block mb-2">Kiểu khung viền</span>
                <div className="grid grid-cols-3 gap-2">
                  {FRAME_STYLES.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() =>
                        onUpdateDesign((prev) => ({ ...prev, frameStyle: f.id }))
                      }
                      className={`py-2 px-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                        design.frameStyle === f.id
                          ? 'bg-[#242834] border-[#E11D48] text-[#F4F5F7]'
                          : 'bg-[#151821] border-[#242834] text-[#9CA3AF] hover:text-[#F4F5F7]'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* TAB 2: EFFECTS */}
        {activeTab === 'effects' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-sm font-semibold text-[#F4F5F7] mb-3">
                Chọn hiệu ứng động thời gian thực
              </h2>
              <div className="space-y-2">
                {EFFECT_TYPES.map((eff) => {
                  const active = design.effect.type === eff.id;
                  return (
                    <button
                      key={eff.id}
                      type="button"
                      onClick={() =>
                        onUpdateDesign((prev) => ({
                          ...prev,
                          effect: { ...prev.effect, type: eff.id },
                        }))
                      }
                      className={`w-full text-left p-3 rounded-xl border transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#1B1F2A] border-[#E11D48]'
                          : 'bg-[#151821] border-[#232734] hover:border-[#373D50]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#F4F5F7]">{eff.label}</span>
                        {active && (
                          <span className="text-[11px] font-medium text-[#FB7185]">Đang bật</span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#8B92A5] mt-1">{eff.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-[#22252E] pt-5 space-y-4">
              <h3 className="text-sm font-semibold text-[#F4F5F7]">Bảng màu hiệu ứng</h3>
              <div className="space-y-2">
                {(Object.keys(EFFECT_PALETTES) as EffectPaletteId[]).map((pid) => {
                  const pal = EFFECT_PALETTES[pid];
                  const active = design.effect.palette === pid;
                  return (
                    <button
                      key={pid}
                      type="button"
                      onClick={() =>
                        onUpdateDesign((prev) => ({
                          ...prev,
                          effect: { ...prev.effect, palette: pid },
                        }))
                      }
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#1B1F2A] border-[#E11D48]'
                          : 'bg-[#151821] border-[#232734] hover:border-[#373D50]'
                      }`}
                    >
                      <span className="text-xs font-medium text-[#E5E7EB]">{pal.name}</span>
                      <div className="flex items-center gap-1">
                        {pal.colors.map((hex) => (
                          <span
                            key={hex}
                            className="w-3.5 h-3.5 rounded-full border border-black/30"
                            style={{ backgroundColor: hex }}
                          />
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-[#22252E] pt-5 space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-[#9CA3AF]">Mật độ hạt</span>
                  <span className="font-mono tabular-nums text-[#D1D5DB]">
                    {Math.round(design.effect.density * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0.2}
                  max={1.5}
                  step={0.05}
                  value={design.effect.density}
                  onChange={(e) =>
                    onUpdateDesign((prev) => ({
                      ...prev,
                      effect: { ...prev.effect, density: Number(e.target.value) },
                    }))
                  }
                  className="w-full studio-slider"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-[#9CA3AF]">Tốc độ chuyển động</span>
                  <span className="font-mono tabular-nums text-[#D1D5DB]">
                    {design.effect.speed.toFixed(1)}x
                  </span>
                </div>
                <input
                  type="range"
                  min={0.3}
                  max={2.0}
                  step={0.1}
                  value={design.effect.speed}
                  onChange={(e) =>
                    onUpdateDesign((prev) => ({
                      ...prev,
                      effect: { ...prev.effect, speed: Number(e.target.value) },
                    }))
                  }
                  className="w-full studio-slider"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-[#D1D5DB]">Phát sáng rực rỡ (Glow)</span>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateDesign((prev) => ({
                      ...prev,
                      effect: { ...prev.effect, glow: !prev.effect.glow },
                    }))
                  }
                  className={`px-3 py-1 text-xs font-medium rounded-md border cursor-pointer ${
                    design.effect.glow
                      ? 'bg-[#E11D48]/20 border-[#E11D48] text-[#FDA4AF]'
                      : 'bg-[#161922] border-[#262A36] text-[#8B92A5]'
                  }`}
                >
                  {design.effect.glow ? 'Đang bật' : 'Đang tắt'}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-[#D1D5DB]">Kết hợp ánh sao nền</span>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateDesign((prev) => ({
                      ...prev,
                      effect: {
                        ...prev.effect,
                        secondarySparkle: !prev.effect.secondarySparkle,
                      },
                    }))
                  }
                  className={`px-3 py-1 text-xs font-medium rounded-md border cursor-pointer ${
                    design.effect.secondarySparkle
                      ? 'bg-[#E11D48]/20 border-[#E11D48] text-[#FDA4AF]'
                      : 'bg-[#161922] border-[#262A36] text-[#8B92A5]'
                  }`}
                >
                  {design.effect.secondarySparkle ? 'Đang bật' : 'Đang tắt'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: TYPOGRAPHY & FONT LIBRARY */}
        {activeTab === 'typography' && (
          <div className="space-y-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-[#F4F5F7]">Nội dung lời chúc</h2>
                <span className="text-[11px] text-[#8B92A5]">Shift + Enter để xuống dòng</span>
              </div>

              <div>
                <label className="text-xs text-[#9CA3AF] block mb-1">Dòng mở đầu (Kicker)</label>
                <textarea
                  rows={Math.min(4, Math.max(1, design.text.kicker.split('\n').length))}
                  value={design.text.kicker}
                  onChange={(e) =>
                    onUpdateDesign((prev) => ({
                      ...prev,
                      text: { ...prev.text, kicker: e.target.value },
                    }))
                  }
                  placeholder="Nhấn Shift + Enter để xuống dòng..."
                  className="w-full px-3 py-2 text-xs bg-[#161922] border border-[#262A36] focus:border-[#E11D48] rounded-lg text-[#F4F5F7] outline-none resize-none leading-relaxed"
                />
              </div>

              <div>
                <label className="text-xs text-[#9CA3AF] block mb-1">Tiêu đề chính</label>
                <textarea
                  rows={Math.min(4, Math.max(1, design.text.headline.split('\n').length))}
                  value={design.text.headline}
                  onChange={(e) =>
                    onUpdateDesign((prev) => ({
                      ...prev,
                      text: { ...prev.text, headline: e.target.value },
                    }))
                  }
                  placeholder="Nhấn Shift + Enter để xuống dòng..."
                  className="w-full px-3 py-2 text-xs bg-[#161922] border border-[#262A36] focus:border-[#E11D48] rounded-lg text-[#F4F5F7] outline-none resize-none leading-relaxed"
                />
              </div>

              <div>
                <label className="text-xs text-[#9CA3AF] block mb-1">Lời chúc chi tiết</label>
                <textarea
                  rows={Math.min(6, Math.max(3, design.text.body.split('\n').length))}
                  value={design.text.body}
                  onChange={(e) =>
                    onUpdateDesign((prev) => ({
                      ...prev,
                      text: { ...prev.text, body: e.target.value },
                    }))
                  }
                  placeholder="Nhập lời chúc (Shift + Enter để xuống dòng)..."
                  className="w-full px-3 py-2 text-xs bg-[#161922] border border-[#262A36] focus:border-[#E11D48] rounded-lg text-[#F4F5F7] outline-none resize-y leading-relaxed"
                />
              </div>

              <div>
                <label className="text-xs text-[#9CA3AF] block mb-1">Người gửi / Ký tên</label>
                <textarea
                  rows={Math.min(4, Math.max(1, design.text.signature.split('\n').length))}
                  value={design.text.signature}
                  onChange={(e) =>
                    onUpdateDesign((prev) => ({
                      ...prev,
                      text: { ...prev.text, signature: e.target.value },
                    }))
                  }
                  placeholder="Nhấn Shift + Enter để xuống dòng..."
                  className="w-full px-3 py-2 text-xs bg-[#161922] border border-[#262A36] focus:border-[#E11D48] rounded-lg text-[#F4F5F7] outline-none resize-none leading-relaxed"
                />
              </div>
            </div>

            <div className="border-t border-[#22252E] pt-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#F4F5F7]">Kho Font Chữ Nghệ Thuật</h3>
                <span className="text-xs text-[#8B92A5] tabular-nums">{filteredFonts.length} font</span>
              </div>

              <div className="flex flex-wrap gap-1 p-1 bg-[#161922] border border-[#242834] rounded-lg">
                {(['Tất cả', 'Cổ điển', 'Thư pháp', 'Hiện đại', 'Kỹ thuật'] as const).map(
                  (cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFontCategory(cat)}
                      className={`px-2 py-1 text-[11px] font-medium rounded-md cursor-pointer whitespace-nowrap ${
                        fontCategory === cat
                          ? 'bg-[#282D3A] text-[#F4F5F7]'
                          : 'text-[#8B92A5] hover:text-[#F4F5F7]'
                      }`}
                    >
                      {cat}
                    </button>
                  )
                )}
              </div>

              <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1">
                {filteredFonts.map((font) => {
                  const active = design.text.headlineFont === font.family;
                  return (
                    <button
                      key={font.id}
                      type="button"
                      onClick={() =>
                        onUpdateDesign((prev) => ({
                          ...prev,
                          text: { ...prev.text, headlineFont: font.family },
                        }))
                      }
                      className={`flex items-center justify-between px-3 py-2 rounded-lg border text-left cursor-pointer transition-colors ${
                        active
                          ? 'bg-[#1D2230] border-[#E11D48]'
                          : 'bg-[#151821] border-[#232734] hover:border-[#3A4054]'
                      }`}
                    >
                      <span
                        className="text-base text-[#F4F5F7] truncate max-w-[200px]"
                        style={{ fontFamily: font.family }}
                      >
                        {font.previewText}
                      </span>
                      <span className="text-[11px] text-[#8B92A5] shrink-0 ml-2">
                        {font.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-[#22252E] pt-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#9CA3AF]">Căn lề chữ</span>
                <div className="flex items-center gap-1 p-1 bg-[#161922] border border-[#242834] rounded-lg">
                  {(
                    [
                      { id: 'left', icon: AlignLeft },
                      { id: 'center', icon: AlignCenter },
                      { id: 'right', icon: AlignRight },
                    ] as const
                  ).map(({ id, icon: Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() =>
                        onUpdateDesign((prev) => ({
                          ...prev,
                          text: { ...prev.text, align: id },
                        }))
                      }
                      className={`p-1.5 rounded-md cursor-pointer ${
                        design.text.align === id
                          ? 'bg-[#282D3A] text-[#F4F5F7]'
                          : 'text-[#8B92A5] hover:text-[#F4F5F7]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#9CA3AF]">Cỡ tiêu đề</span>
                  <span className="font-mono tabular-nums text-[#D1D5DB]">
                    {design.text.headlineSize}px
                  </span>
                </div>
                <input
                  type="range"
                  min={36}
                  max={108}
                  step={2}
                  value={design.text.headlineSize}
                  onChange={(e) =>
                    onUpdateDesign((prev) => ({
                      ...prev,
                      text: { ...prev.text, headlineSize: Number(e.target.value) },
                    }))
                  }
                  className="w-full studio-slider"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#9CA3AF]">Vị trí dọc cụm chữ</span>
                  <span className="font-mono tabular-nums text-[#D1D5DB]">
                    {Math.round(design.text.textY * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0.12}
                  max={0.86}
                  step={0.02}
                  value={design.text.textY}
                  onChange={(e) =>
                    onUpdateDesign((prev) => ({
                      ...prev,
                      text: { ...prev.text, textY: Number(e.target.value) },
                    }))
                  }
                  className="w-full studio-slider"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <label className="block">
                  <span className="text-[11px] text-[#9CA3AF] block mb-1">Tiêu đề</span>
                  <div className="flex items-center gap-1.5 bg-[#161922] border border-[#262A36] rounded-lg px-2 py-1.5">
                    <input
                      type="color"
                      value={design.text.headlineColor}
                      onChange={(e) =>
                        onUpdateDesign((prev) => ({
                          ...prev,
                          text: { ...prev.text, headlineColor: e.target.value },
                        }))
                      }
                      className="w-4 h-4 rounded cursor-pointer bg-transparent border-0"
                    />
                    <span className="text-[10px] font-mono text-[#D1D5DB]">Màu</span>
                  </div>
                </label>

                <label className="block">
                  <span className="text-[11px] text-[#9CA3AF] block mb-1">Nội dung</span>
                  <div className="flex items-center gap-1.5 bg-[#161922] border border-[#262A36] rounded-lg px-2 py-1.5">
                    <input
                      type="color"
                      value={design.text.bodyColor}
                      onChange={(e) =>
                        onUpdateDesign((prev) => ({
                          ...prev,
                          text: { ...prev.text, bodyColor: e.target.value },
                        }))
                      }
                      className="w-4 h-4 rounded cursor-pointer bg-transparent border-0"
                    />
                    <span className="text-[10px] font-mono text-[#D1D5DB]">Màu</span>
                  </div>
                </label>

                <label className="block">
                  <span className="text-[11px] text-[#9CA3AF] block mb-1">Điểm nhấn</span>
                  <div className="flex items-center gap-1.5 bg-[#161922] border border-[#262A36] rounded-lg px-2 py-1.5">
                    <input
                      type="color"
                      value={design.text.accentColor}
                      onChange={(e) =>
                        onUpdateDesign((prev) => ({
                          ...prev,
                          text: { ...prev.text, accentColor: e.target.value },
                        }))
                      }
                      className="w-4 h-4 rounded cursor-pointer bg-transparent border-0"
                    />
                    <span className="text-[10px] font-mono text-[#D1D5DB]">Màu</span>
                  </div>
                </label>
              </div>

              <div>
                <span className="text-xs text-[#9CA3AF] block mb-2">Hiệu ứng xuất hiện chữ</span>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { id: 'fade-up', label: 'Trượt êm' },
                      { id: 'pop', label: 'Nảy nổi bật' },
                      { id: 'typewriter', label: 'Gõ chữ từng ký tự' },
                      { id: 'none', label: 'Hiển thị tĩnh' },
                    ] as Array<{ id: TextAnimationId; label: string }>
                  ).map((anim) => (
                    <button
                      key={anim.id}
                      type="button"
                      onClick={() =>
                        onUpdateDesign((prev) => ({
                          ...prev,
                          text: { ...prev.text, animation: anim.id },
                        }))
                      }
                      className={`py-2 px-2.5 text-xs font-medium rounded-lg border cursor-pointer ${
                        design.text.animation === anim.id
                          ? 'bg-[#242834] border-[#E11D48] text-[#F4F5F7]'
                          : 'bg-[#151821] border-[#242834] text-[#9CA3AF] hover:text-[#F4F5F7]'
                      }`}
                    >
                      {anim.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: STICKERS */}
        {activeTab === 'stickers' && (
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-[#F4F5F7]">Kho Sticker Đa Dạng</h2>
                <span className="text-xs text-[#8B92A5] tabular-nums">
                  {filteredStickers.length} nhãn
                </span>
              </div>

              <div className="flex flex-wrap gap-1 p-1 bg-[#161922] border border-[#242834] rounded-lg mb-3">
                {(['Tất cả', 'Tri ân Thầy Cô', 'Năm Mới & Lễ Hội', 'Trang Trí'] as const).map(
                  (cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setStickerCategory(cat)}
                      className={`px-2 py-1 text-[11px] font-medium rounded-md cursor-pointer whitespace-nowrap ${
                        stickerCategory === cat
                          ? 'bg-[#282D3A] text-[#F4F5F7]'
                          : 'text-[#8B92A5] hover:text-[#F4F5F7]'
                      }`}
                    >
                      {cat}
                    </button>
                  )
                )}
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {filteredStickers.map((stk) => (
                  <button
                    key={stk.id}
                    type="button"
                    onClick={() => handleAddSticker(stk.id)}
                    className="p-2.5 rounded-xl bg-[#151821] hover:bg-[#1C202B] border border-[#242834] hover:border-[#3E455B] transition-colors flex flex-col items-center gap-1.5 cursor-pointer"
                  >
                    <StickerThumbnail stickerId={stk.id} size={46} />
                    <span className="text-[11px] text-[#D1D5DB] text-center leading-tight line-clamp-1">
                      {stk.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {selectedSticker ? (
              <div className="border-t border-[#22252E] pt-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[#F4F5F7]">Tùy chỉnh sticker đang chọn</h3>
                  <button
                    type="button"
                    onClick={removeSelectedSticker}
                    className="inline-flex items-center gap-1 text-xs text-[#FB7185] hover:text-[#F43F5E] cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Xóa
                  </button>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#9CA3AF]">Kích thước</span>
                    <span className="font-mono tabular-nums text-[#D1D5DB]">
                      {selectedSticker.scale.toFixed(2)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.4}
                    max={2.4}
                    step={0.05}
                    value={selectedSticker.scale}
                    onChange={(e) => updateSelectedSticker({ scale: Number(e.target.value) })}
                    className="w-full studio-slider"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#9CA3AF]">Xoay góc</span>
                    <span className="font-mono tabular-nums text-[#D1D5DB]">
                      {selectedSticker.rotation}°
                    </span>
                  </div>
                  <input
                    type="range"
                    min={-180}
                    max={180}
                    step={2}
                    value={selectedSticker.rotation}
                    onChange={(e) => updateSelectedSticker({ rotation: Number(e.target.value) })}
                    className="w-full studio-slider"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#9CA3AF]">Độ trong suốt</span>
                    <span className="font-mono tabular-nums text-[#D1D5DB]">
                      {Math.round(selectedSticker.opacity * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.15}
                    max={1}
                    step={0.05}
                    value={selectedSticker.opacity}
                    onChange={(e) => updateSelectedSticker({ opacity: Number(e.target.value) })}
                    className="w-full studio-slider"
                  />
                </div>
              </div>
            ) : (
              <div className="border-t border-[#22252E] pt-4 text-xs text-[#8B92A5]">
                Nhấn vào một sticker ở trên để thêm vào thiệp, hoặc nhấn trực tiếp lên sticker trên khung xem trước để kéo vị trí và xoay góc.
              </div>
            )}
          </div>
        )}

        {/* TAB 5: PHOTO COLLAGE & ARTISTIC FILTERS */}
        {activeTab === 'collage' && (
          <div className="space-y-6">
            {/* Collage Layout Selector */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <ImagePlus className="w-4 h-4 text-[#FBBF24]" />
                <h2 className="text-sm font-semibold text-[#F4F5F7]">Công cụ cắt ghép ảnh</h2>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {COLLAGE_LAYOUTS.map((lay) => (
                  <button
                    key={lay.id}
                    type="button"
                    onClick={() =>
                      onUpdateDesign((prev) => ({
                        ...prev,
                        collage: { ...prev.collage, layout: lay.id },
                      }))
                    }
                    className={`py-2 px-2 text-xs font-medium rounded-lg border cursor-pointer ${
                      design.collage.layout === lay.id
                        ? 'bg-[#242834] border-[#E11D48] text-[#F4F5F7]'
                        : 'bg-[#151821] border-[#242834] text-[#9CA3AF] hover:text-[#F4F5F7]'
                    }`}
                  >
                    {lay.label}
                  </button>
                ))}
              </div>

              {activeSlotCount > 0 && (
                <div className="space-y-2.5 pt-2">
                  {Array.from({ length: activeSlotCount }).map((_, idx) => {
                    const slot = design.collage.slots[idx];
                    return (
                      <div
                        key={slot?.id || idx}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-[#151821] border border-[#242834] gap-3"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-11 h-11 rounded-lg overflow-hidden bg-[#1E222E] border border-[#2B3040] shrink-0">
                            {slot?.imageUrl ? (
                              <img
                                src={slot.imageUrl}
                                alt={`Khung ${idx + 1}`}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            ) : null}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-[#F4F5F7]">Ô ảnh {idx + 1}</p>
                            <p className="text-[11px] text-[#8B92A5] tabular-nums">
                              Zoom {slot?.zoom.toFixed(1)}x · {slot?.rotation}°
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <label className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium bg-[#1F2430] hover:bg-[#2B3142] text-[#E5E7EB] rounded-lg cursor-pointer">
                            <Upload className="w-3 h-3" />
                            Đổi ảnh
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleUploadSlotImage(idx, e)}
                              className="hidden"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => onOpenCropModal(idx)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium bg-[#E11D48]/15 hover:bg-[#E11D48]/25 text-[#FDA4AF] border border-[#E11D48]/30 rounded-lg cursor-pointer"
                          >
                            <Crop className="w-3 h-3" />
                            Cắt
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[#9CA3AF]">Vị trí dọc</span>
                        <span className="font-mono tabular-nums text-[#D1D5DB]">
                          {Math.round(design.collage.positionY * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0.22}
                        max={0.82}
                        step={0.02}
                        value={design.collage.positionY}
                        onChange={(e) =>
                          onUpdateDesign((prev) => ({
                            ...prev,
                            collage: { ...prev.collage, positionY: Number(e.target.value) },
                          }))
                        }
                        className="w-full studio-slider"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[#9CA3AF]">Chiều cao khung</span>
                        <span className="font-mono tabular-nums text-[#D1D5DB]">
                          {Math.round(design.collage.heightScale * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0.24}
                        max={0.72}
                        step={0.02}
                        value={design.collage.heightScale}
                        onChange={(e) =>
                          onUpdateDesign((prev) => ({
                            ...prev,
                            collage: { ...prev.collage, heightScale: Number(e.target.value) },
                          }))
                        }
                        className="w-full studio-slider"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[#9CA3AF]">Bo góc ảnh</span>
                        <span className="font-mono tabular-nums text-[#D1D5DB]">
                          {design.collage.radius}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={48}
                        step={2}
                        value={design.collage.radius}
                        onChange={(e) =>
                          onUpdateDesign((prev) => ({
                            ...prev,
                            collage: { ...prev.collage, radius: Number(e.target.value) },
                          }))
                        }
                        className="w-full studio-slider"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[#9CA3AF]">Khoảng cách ảnh</span>
                        <span className="font-mono tabular-nums text-[#D1D5DB]">
                          {design.collage.gap}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={32}
                        step={2}
                        value={design.collage.gap}
                        onChange={(e) =>
                          onUpdateDesign((prev) => ({
                            ...prev,
                            collage: { ...prev.collage, gap: Number(e.target.value) },
                          }))
                        }
                        className="w-full studio-slider"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Artistic Color Filters */}
            <div className="border-t border-[#22252E] pt-5 space-y-3">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-[#FBBF24]" />
                <h3 className="text-sm font-semibold text-[#F4F5F7]">Bộ lọc màu nghệ thuật</h3>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(FILTER_PRESETS) as ColorFilterId[]).map((fid) => {
                  const preset = FILTER_PRESETS[fid];
                  const active = design.filter.id === fid;
                  return (
                    <button
                      key={fid}
                      type="button"
                      onClick={() =>
                        onUpdateDesign((prev) => ({
                          ...prev,
                          filter: { ...preset },
                        }))
                      }
                      className={`p-2.5 text-left rounded-xl border transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#1D2230] border-[#E11D48]'
                          : 'bg-[#151821] border-[#232734] hover:border-[#3A4054]'
                      }`}
                    >
                      <p className="text-xs font-semibold text-[#F4F5F7] truncate">{preset.name}</p>
                      <p className="text-[11px] text-[#8B92A5] line-clamp-1 mt-0.5">
                        {preset.description}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-medium text-[#D1D5DB]">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[#9CA3AF]" />
                  <span>Tinh chỉnh thông số màu</span>
                </div>

                {[
                  { key: 'brightness', label: 'Độ sáng', min: 65, max: 145 },
                  { key: 'contrast', label: 'Tương phản', min: 70, max: 150 },
                  { key: 'saturate', label: 'Độ bão hòa màu', min: 0, max: 180 },
                  { key: 'vignette', label: 'Tối góc (Vignette)', min: 0, max: 85 },
                  { key: 'grain', label: 'Nhiễu hạt phim (Grain)', min: 0, max: 70 },
                ].map((ctrl) => {
                  const val = design.filter[ctrl.key as keyof typeof design.filter] as number;
                  return (
                    <div key={ctrl.key}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[#9CA3AF]">{ctrl.label}</span>
                        <span className="font-mono tabular-nums text-[#D1D5DB]">{val}%</span>
                      </div>
                      <input
                        type="range"
                        min={ctrl.min}
                        max={ctrl.max}
                        step={2}
                        value={val}
                        onChange={(e) =>
                          onUpdateDesign((prev) => ({
                            ...prev,
                            filter: {
                              ...prev.filter,
                              [ctrl.key]: Number(e.target.value),
                            },
                          }))
                        }
                        className="w-full studio-slider"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
