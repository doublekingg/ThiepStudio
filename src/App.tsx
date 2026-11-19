import { useEffect, useState } from 'react';
import { CanvasStage } from './components/CanvasStage';
import { ExportShareModal } from './components/ExportShareModal';
import { LeftSidebar } from './components/LeftSidebar';
import { LivePreviewModal } from './components/LivePreviewModal';
import { PhotoCropModal } from './components/PhotoCropModal';
import { TopBar } from './components/TopBar';
import { CARD_TEMPLATES } from './data/presets';
import {
  AspectRatioId,
  CardDesignState,
  CardTemplate,
  PhotoSlot,
  SelectedObject,
  StudioTabId,
} from './types/studio';

function buildInitialDesign(tpl: CardTemplate): CardDesignState {
  return {
    templateId: tpl.id,
    ...structuredClone(tpl.state),
  };
}

export default function App() {
  const [design, setDesign] = useState<CardDesignState>(() => buildInitialDesign(CARD_TEMPLATES[0]));
  const [activeTab, setActiveTab] = useState<StudioTabId>('templates');
  const [selectedObject, setSelectedObject] = useState<SelectedObject>(null);
  const [cropSlotIndex, setCropSlotIndex] = useState<number | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [mobilePreviewExpanded, setMobilePreviewExpanded] = useState(false);

  const selectedStickerUid = selectedObject?.type === 'sticker' ? selectedObject.uid : null;

  // Keyboard shortcut: Delete selected sticker or Deselect with Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedObject(null);
        return;
      }
      if (!selectedStickerUid) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        setDesign((prev) => ({
          ...prev,
          stickers: prev.stickers.filter((s) => s.uid !== selectedStickerUid),
        }));
        setSelectedObject(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedStickerUid]);

  const handleApplyTemplate = (template: CardTemplate) => {
    setSelectedObject(null);
    setDesign(buildInitialDesign(template));
  };

  const handleChangeAspectRatio = (ratio: AspectRatioId) => {
    setDesign((prev) => ({ ...prev, aspectRatio: ratio }));
  };

  const handleSaveCropSlot = (updated: PhotoSlot) => {
    if (cropSlotIndex === null) return;
    setDesign((prev) => {
      const nextSlots = [...prev.collage.slots];
      nextSlots[cropSlotIndex] = updated;
      return {
        ...prev,
        collage: { ...prev.collage, slots: nextSlots },
      };
    });
    setCropSlotIndex(null);
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-[#0B0C10] text-[#F4F5F7] overflow-hidden">
      <TopBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenPreview={() => setShowPreviewModal(true)}
        onOpenExport={() => setShowExportModal(true)}
      />

      <main className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        <LeftSidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          design={design}
          onApplyTemplate={handleApplyTemplate}
          onUpdateDesign={setDesign}
          selectedStickerUid={selectedStickerUid}
          onSelectSticker={(uid) =>
            setSelectedObject(uid ? { type: 'sticker', uid } : null)
          }
          onOpenCropModal={(idx) => setCropSlotIndex(idx)}
        />

        <CanvasStage
          design={design}
          selectedObject={selectedObject}
          onSelectObject={setSelectedObject}
          onUpdateDesign={setDesign}
          onChangeAspectRatio={handleChangeAspectRatio}
          onOpenPreview={() => setShowPreviewModal(true)}
          mobileExpanded={mobilePreviewExpanded}
          onToggleMobileExpand={() => setMobilePreviewExpanded((v) => !v)}
        />
      </main>

      {cropSlotIndex !== null && design.collage.slots[cropSlotIndex] && (
        <PhotoCropModal
          slotIndex={cropSlotIndex}
          slot={design.collage.slots[cropSlotIndex]}
          onSave={handleSaveCropSlot}
          onClose={() => setCropSlotIndex(null)}
        />
      )}

      {showPreviewModal && (
        <LivePreviewModal
          design={design}
          onClose={() => setShowPreviewModal(false)}
          onOpenExport={() => setShowExportModal(true)}
        />
      )}

      {showExportModal && (
        <ExportShareModal
          design={design}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </div>
  );
}
