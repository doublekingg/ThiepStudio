import { StudioTabId } from '../types/studio';

interface TopBarProps {
  activeTab: StudioTabId;
  onSelectTab: (tab: StudioTabId) => void;
  onOpenPreview: () => void;
  onOpenExport: () => void;
}

export function TopBar({
  activeTab,
  onSelectTab,
  onOpenPreview,
  onOpenExport,
}: TopBarProps) {
  return (
    <header className="h-12 lg:h-14 border-b border-[#22252E] bg-[#0E1015] px-4 lg:px-6 flex items-center justify-between gap-4 lg:gap-8 shrink-0">
      {/* Zone 1: Single text element wordmark */}
      <a
        href="#top"
        onClick={(e) => {
          e.preventDefault();
          onSelectTab('templates');
        }}
        className="text-sm lg:text-base font-bold tracking-tight text-[#F4F5F7] whitespace-nowrap shrink-0"
      >
        Thiệp Studio
      </a>

      {/* Zone 2: 4 concise single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#9CA3AF]">
        <button
          type="button"
          onClick={() => onSelectTab('templates')}
          className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'templates'
              ? 'border-[#E11D48] text-[#F4F5F7]'
              : 'border-transparent hover:text-[#F4F5F7]'
          }`}
        >
          Mẫu thiết kế
        </button>
        <button
          type="button"
          onClick={() => onSelectTab('effects')}
          className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'effects'
              ? 'border-[#E11D48] text-[#F4F5F7]'
              : 'border-transparent hover:text-[#F4F5F7]'
          }`}
        >
          Kho hiệu ứng
        </button>
        <button
          type="button"
          onClick={() => onSelectTab('collage')}
          className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'collage'
              ? 'border-[#E11D48] text-[#F4F5F7]'
              : 'border-transparent hover:text-[#F4F5F7]'
          }`}
        >
          Cắt ghép ảnh
        </button>
        <button
          type="button"
          onClick={onOpenPreview}
          className="py-1 border-b-2 border-transparent hover:text-[#F4F5F7] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          Xem trước
        </button>
      </nav>

      {/* Zone 3: 1 primary CTA action */}
      <div className="flex items-center shrink-0">
        <button
          type="button"
          onClick={onOpenExport}
          className="px-3.5 lg:px-4 py-1.5 lg:py-2 text-xs font-semibold text-white bg-[#E11D48] hover:bg-[#BE123C] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <span className="sm:hidden">Xuất Story</span>
          <span className="hidden sm:inline">Xuất Story & Chia sẻ</span>
        </button>
      </div>
    </header>
  );
}
