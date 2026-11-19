import { useEffect, useRef, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  Film,
  Image as ImageIcon,
  Share2,
  X,
} from 'lucide-react';
import { ASPECT_RATIOS } from '../data/presets';
import { renderCardFrame } from '../engine/cardRenderer';
import { ParticleEngine } from '../engine/particleEngine';
import { CardDesignState } from '../types/studio';

interface ExportShareModalProps {
  design: CardDesignState;
  onClose: () => void;
}

export function ExportShareModal({ design, onClose }: ExportShareModalProps) {
  const [durationSec, setDurationSec] = useState<5 | 8 | 12>(8);
  const [forceStory916, setForceStory916] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recordProgress, setRecordProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoExt, setVideoExt] = useState<'mp4' | 'webm'>('webm');
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const rafRef = useRef<number>(0);

  const defaultCaption = `${design.text.headline}\n\n${design.text.body}\n— ${design.text.signature}\n\n${
    design.occasion === 'teacher'
      ? '#TriAnThayCo #NgayNhaGiaoVietNam #ChucMung2011'
      : design.occasion === 'new-year'
      ? '#ChucMungNamMoi #AnKhangThinhVuong #TetSumVay'
      : '#ChucMung #KyNiemDep'
  }`;

  const [caption, setCaption] = useState(defaultCaption);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        recorderRef.current.stop();
      }
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);

  const getTargetDimensions = () => {
    if (forceStory916) {
      return { width: 720, height: 1280 };
    }
    const spec = ASPECT_RATIOS.find((r) => r.id === design.aspectRatio) || ASPECT_RATIOS[0];
    return { width: spec.width, height: spec.height };
  };

  const handleDownloadPng = () => {
    const { width, height } = getTargetDimensions();
    const offscreen = document.createElement('canvas');
    offscreen.width = width;
    offscreen.height = height;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return;

    const engine = new ParticleEngine(width, height);
    // Step particles forward briefly so fireworks/confetti look rich on still PNG
    for (let i = 0; i < 45; i++) {
      renderCardFrame(ctx, width, height, design, engine, {
        elapsedMs: 1800 + i * 16,
        selectedStickerUid: null,
        dtFactor: 1,
      });
    }

    const dataUrl = offscreen.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `thiep-chuc-mung-${design.occasion}.png`;
    a.click();
  };

  const handleStartVideoExport = () => {
    setExportError(null);
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
      setVideoUrl(null);
      setVideoBlob(null);
    }

    if (typeof MediaRecorder === 'undefined') {
      setExportError('Trình duyệt hiện tại không hỗ trợ ghi video trực tiếp. Vui lòng thử Chrome hoặc Edge.');
      return;
    }

    const { width, height } = getTargetDimensions();
    const offscreen = document.createElement('canvas');
    offscreen.width = width;
    offscreen.height = height;
    const ctx = offscreen.getContext('2d');
    if (!ctx) {
      setExportError('Không thể khởi tạo bộ kết xuất đồ họa.');
      return;
    }

    // Choose best supported codec
    const candidates = [
      { mime: 'video/mp4;codecs=avc1', ext: 'mp4' as const },
      { mime: 'video/mp4', ext: 'mp4' as const },
      { mime: 'video/webm;codecs=vp9', ext: 'webm' as const },
      { mime: 'video/webm;codecs=vp8', ext: 'webm' as const },
      { mime: 'video/webm', ext: 'webm' as const },
    ];
    const picked = candidates.find((c) => MediaRecorder.isTypeSupported(c.mime)) || {
      mime: '',
      ext: 'webm' as const,
    };

    setVideoExt(picked.ext);
    const stream = offscreen.captureStream(30);
    const recorder = picked.mime
      ? new MediaRecorder(stream, { mimeType: picked.mime, videoBitsPerSecond: 4_500_000 })
      : new MediaRecorder(stream, { videoBitsPerSecond: 4_500_000 });

    recorderRef.current = recorder;
    const chunks: BlobPart[] = [];

    recorder.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0) {
        chunks.push(ev.data);
      }
    };

    recorder.onstop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      const blob = new Blob(chunks, { type: picked.mime || 'video/webm' });
      const url = URL.createObjectURL(blob);
      setVideoBlob(blob);
      setVideoUrl(url);
      setIsRecording(false);
      setRecordProgress(100);
    };

    const engine = new ParticleEngine(width, height);
    const totalMs = durationSec * 1000;
    const startTime = performance.now();
    let lastTime = startTime;

    setIsRecording(true);
    setRecordProgress(0);
    recorder.start(200);

    const step = (now: number) => {
      const elapsed = now - startTime;
      const delta = Math.min(48, now - lastTime);
      lastTime = now;

      renderCardFrame(ctx, width, height, design, engine, {
        elapsedMs: elapsed,
        selectedStickerUid: null,
        dtFactor: delta / 16.667,
      });

      setRecordProgress(Math.min(99, Math.round((elapsed / totalMs) * 100)));

      if (elapsed >= totalMs) {
        if (recorder.state !== 'inactive') {
          recorder.stop();
        }
        return;
      }
      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
  };

  const handleCopyCaption = async () => {
    try {
      await navigator.clipboard.writeText(caption);
      setCopiedCaption(true);
      setTimeout(() => setCopiedCaption(false), 2000);
    } catch {
      // Fallback ignored
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Fallback ignored
    }
  };

  const handleNativeShare = async () => {
    if (!navigator.share) return;
    try {
      if (videoBlob && navigator.canShare) {
        const file = new File([videoBlob], `story-chuc-mung.${videoExt}`, {
          type: videoBlob.type,
        });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: design.text.headline,
            text: caption,
            files: [file],
          });
          return;
        }
      }
      await navigator.share({
        title: design.text.headline,
        text: caption,
        url: window.location.href,
      });
    } catch {
      // User cancelled share
    }
  };

  const shareUrlEncoded = encodeURIComponent(window.location.href);
  const shareTextEncoded = encodeURIComponent(caption);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[#13161E] border border-[#272B38] rounded-2xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#232734] flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-semibold text-[#F4F5F7]">
              Xuất Video Facebook Story & Chia Sẻ Nhanh
            </h2>
            <p className="text-xs text-[#8B92A5] mt-0.5">
              Kết xuất trực tiếp thiệp động kèm hiệu ứng và chia sẻ lên mạng xã hội
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

        <div className="p-6 overflow-y-auto space-y-6">
          {/* Section 1: Short Video Export for Facebook Story */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-[#FBBF24]" />
                <h3 className="text-sm font-semibold text-[#F4F5F7]">
                  1. Xuất video ngắn cho Facebook Story
                </h3>
              </div>
              <button
                type="button"
                onClick={handleDownloadPng}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#1C202B] hover:bg-[#252A38] border border-[#2C3142] text-[#E5E7EB] rounded-lg cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                Tải ảnh tĩnh PNG
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-[#181B24] border border-[#252936]">
                <span className="text-xs text-[#9CA3AF] block mb-2">Thời lượng video Story</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {([5, 8, 12] as const).map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      disabled={isRecording}
                      onClick={() => setDurationSec(sec)}
                      className={`py-1.5 text-xs font-medium rounded-lg border cursor-pointer tabular-nums ${
                        durationSec === sec
                          ? 'bg-[#282D3B] border-[#E11D48] text-[#F4F5F7]'
                          : 'bg-[#12141B] border-[#242834] text-[#9CA3AF]'
                      }`}
                    >
                      {sec} giây
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#181B24] border border-[#252936]">
                <span className="text-xs text-[#9CA3AF] block mb-2">Khổ khung hình xuất</span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    disabled={isRecording}
                    onClick={() => setForceStory916(true)}
                    className={`py-1.5 px-2 text-xs font-medium rounded-lg border cursor-pointer ${
                      forceStory916
                        ? 'bg-[#282D3B] border-[#E11D48] text-[#F4F5F7]'
                        : 'bg-[#12141B] border-[#242834] text-[#9CA3AF]'
                    }`}
                  >
                    Chuẩn Story 9:16
                  </button>
                  <button
                    type="button"
                    disabled={isRecording}
                    onClick={() => setForceStory916(false)}
                    className={`py-1.5 px-2 text-xs font-medium rounded-lg border cursor-pointer ${
                      !forceStory916
                        ? 'bg-[#282D3B] border-[#E11D48] text-[#F4F5F7]'
                        : 'bg-[#12141B] border-[#242834] text-[#9CA3AF]'
                    }`}
                  >
                    Khổ hiện tại ({design.aspectRatio})
                  </button>
                </div>
              </div>
            </div>

            {isRecording ? (
              <div className="p-4 rounded-xl bg-[#181B24] border border-[#2A2F3E] space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-[#F4F5F7]">
                    Đang ghi hình hiệu ứng Story...
                  </span>
                  <span className="font-mono tabular-nums text-[#FBBF24]">{recordProgress}%</span>
                </div>
                <div className="h-2 w-full bg-[#101218] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#E11D48] transition-all duration-150"
                    style={{ width: `${recordProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleStartVideoExport}
                className="w-full py-2.5 px-4 text-xs font-semibold bg-[#E11D48] hover:bg-[#BE123C] text-white rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Film className="w-4 h-4" />
                {videoUrl ? 'Tạo lại video Story mới' : `Bắt đầu xuất Video Story (${durationSec}s)`}
              </button>
            )}

            {exportError && (
              <p className="text-xs text-[#FDA4AF] bg-[#E11D48]/10 border border-[#E11D48]/30 rounded-lg px-3 py-2">
                {exportError}
              </p>
            )}

            {videoUrl && (
              <div className="p-4 rounded-xl bg-[#181B24] border border-[#2A2F3E] flex flex-col sm:flex-row items-center gap-4">
                <video
                  src={videoUrl}
                  controls
                  autoPlay
                  loop
                  playsInline
                  className="w-36 max-h-56 rounded-lg bg-black border border-[#2E3446] shrink-0"
                />
                <div className="flex-1 space-y-2.5 text-left">
                  <p className="text-xs font-semibold text-[#F4F5F7]">
                    Video Story đã sẵn sàng!
                  </p>
                  <p className="text-xs text-[#9CA3AF] leading-relaxed">
                    Tải file video về máy rồi mở Facebook chọn <strong>Tạo tin (Create Story)</strong> để đăng tải ngay.
                  </p>
                  <a
                    href={videoUrl}
                    download={`facebook-story-${design.occasion}.${videoExt}`}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-[#10B981] hover:bg-[#059669] text-[#052E16] rounded-lg transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Tải Video (.{videoExt.toUpperCase()})
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Quick Social Share */}
          <div className="border-t border-[#232734] pt-5 space-y-3">
            <div className="flex items-center gap-2">
              <Share2 className="w-4 h-4 text-[#FBBF24]" />
              <h3 className="text-sm font-semibold text-[#F4F5F7]">
                2. Chia sẻ nhanh lên mạng xã hội
              </h3>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-[#9CA3AF]">Lời chúc & Hashtag đính kèm</span>
                <button
                  type="button"
                  onClick={handleCopyCaption}
                  className="inline-flex items-center gap-1 text-xs font-medium text-[#FBBF24] hover:underline cursor-pointer"
                >
                  {copiedCaption ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedCaption ? 'Đã sao chép!' : 'Sao chép lời chúc'}
                </button>
              </div>
              <textarea
                rows={3}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#181B24] border border-[#262A36] rounded-xl text-[#E5E7EB] outline-none resize-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Chia sẻ qua thiết bị
                </button>
              )}

              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrlEncoded}&quote=${shareTextEncoded}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-[#1877F2]/15 hover:bg-[#1877F2]/25 border border-[#1877F2]/40 text-[#93C5FD] rounded-lg transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Đăng lên Facebook
              </a>

              <a
                href={`https://twitter.com/intent/tweet?text=${shareTextEncoded}&url=${shareUrlEncoded}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-[#1C202B] hover:bg-[#262C3B] border border-[#2C3142] text-[#E5E7EB] rounded-lg transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Chia sẻ lên X
              </a>

              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-[#1C202B] hover:bg-[#262C3B] border border-[#2C3142] text-[#E5E7EB] rounded-lg cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-[#34D399]" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedLink ? 'Đã chép liên kết' : 'Sao chép liên kết'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
