import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Icons } from './Icon';
import { VideoPlayer } from './VideoPlayer';

interface HlsPlayerProps {
  embedUrl: string;
  poster?: string;
  title: string;
  onClose: () => void;
  initialProgress?: number;
  onProgress?: (currentTime: number, duration: number) => void;
  onReady?: () => void;
}

const $f = (line: string, base: string): string => {
  if (!line.startsWith('#') && line.trim() && !line.startsWith('http')) {
    try { return new URL(line.trim(), base).href; } catch { return line; }
  }
  return line;
};

const $c = (text: string, base: string): string => {
  const lines = text.split('\n');
  const drop = new Set<number>();
  const isAd = (l: string) => l.includes('convertv8/') || l.includes('/adjump/') || /\/v8\/.*segment_\d{4}\.ts/.test(l);
  for (let i = 0; i < lines.length; i++) {
    if (!isAd(lines[i])) continue;
    drop.add(i);
    for (let j = i - 1; j >= 0; j--) {
      if (drop.has(j)) break;
      const p = lines[j].trim();
      if (p === '' || p.startsWith('#EXTINF') || p.startsWith('#EXT-X-KEY') || p === '#EXT-X-DISCONTINUITY') {
        drop.add(j);
      } else break;
    }
    for (let j = i + 1; j < lines.length; j++) {
      if (lines[j].startsWith('#EXT-X-DISCONTINUITY')) break;
      drop.add(j);
    }
  }
  return lines
    .filter((_, i) => !drop.has(i))
    .map(l => $f(l, base))
    .join('\n');
};

export const HlsPlayer: React.FC<HlsPlayerProps> = ({ embedUrl, poster, title, onClose, initialProgress, onProgress, onReady }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const hasSeeked = useRef(false);

  useEffect(() => {
    if (!embedUrl) { setError(true); return; }
    hasSeeked.current = false;

    const init = async () => {
      const u = new URL(embedUrl);
      const m3u8Url = u.searchParams.get('url');
      if (!m3u8Url) { setError(true); return; }

      try {
        const masterRes = await fetch(m3u8Url);
        const masterText = await masterRes.text();

        const variantMatch = masterText.match(/^(?!\s*#)(.+\.m3u8)\s*$/m);
        if (!variantMatch) { setError(true); return; }

        const variantRel = variantMatch[1].trim();
        const variantUrl = new URL(variantRel, m3u8Url).href;

        const varRes = await fetch(variantUrl);
        const varText = await varRes.text();

        const baseDir = variantUrl.substring(0, variantUrl.lastIndexOf('/') + 1);
        const clean = $c(varText, baseDir);
        const blob = new Blob([clean], { type: 'application/vnd.apple.mpegurl' });
        const blobUrl = URL.createObjectURL(blob);

          if (videoRef.current && Hls.isSupported()) {
            if (hlsRef.current) hlsRef.current.destroy();
            const hls = new Hls({
              enableWorker: true,
              lowLatencyMode: false,
              backbufferLength: 30,
              maxBufferLength: 30,
              maxMaxBufferLength: 60,
            });
          hls.loadSource(blobUrl);
          hls.attachMedia(videoRef.current);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            setReady(true);
            if (initialProgress && initialProgress > 0 && videoRef.current && !hasSeeked.current) {
              videoRef.current.currentTime = initialProgress;
              hasSeeked.current = true;
            }
            videoRef.current?.play().catch(() => {});
            onReady?.();
          });
          hls.on(Hls.Events.ERROR, (_e, data) => {
            if (data.fatal) { setError(true); }
          });
          hlsRef.current = hls;
        } else if (videoRef.current?.canPlayType('application/vnd.apple.mpegurl')) {
          videoRef.current.src = blobUrl;
          setReady(true);
        }
      } catch {
        setError(true);
      }
    };

    init();

    return () => {
      if (hlsRef.current) hlsRef.current.destroy();
    };
  }, [embedUrl]);

  useEffect(() => {
    if (videoRef.current && initialProgress !== undefined && initialProgress > 0 && ready && !hasSeeked.current) {
      videoRef.current.currentTime = initialProgress;
      hasSeeked.current = true;
    }
  }, [initialProgress, ready]);

  useEffect(() => {
    if (showControls) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    }
    return () => clearTimeout(timeoutRef.current);
  }, [showControls]);

  if (error) {
    return (
      <div className="relative w-full h-full bg-black">
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[60] bg-amber-600/90 text-white px-4 py-2 rounded-lg text-sm shadow-lg flex items-center gap-2 backdrop-blur-sm animate-in fade-in">
          <Icons.AlertTriangle size={16} className="shrink-0" />
          <span>Không thể lọc quảng cáo — có quảng cáo ở ~phút 15 (âm lượng to), hãy tua tới 15:30 để bỏ qua</span>
        </div>
        <VideoPlayer embedUrl={embedUrl} poster={poster} title={title} onClose={onClose} />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black group">
      <div
        className={`absolute top-0 left-0 right-0 p-4 z-50 bg-gradient-to-b from-black/80 to-transparent transition-transform duration-300 ${showControls ? 'translate-y-0' : '-translate-y-full'}`}
        onMouseEnter={() => setShowControls(true)}
      >
        <button onClick={onClose} className="flex items-center gap-2 text-white hover:text-purple-400 transition-colors">
          <Icons.ChevronLeft size={28} />
          <div className="flex flex-col text-left">
            <span className="font-bold text-lg leading-none shadow-black drop-shadow-md">{title}</span>
            <span className="text-xs text-slate-300">Đang phát</span>
          </div>
        </button>
      </div>

      <div className="absolute top-0 left-0 w-full h-20 z-40" onMouseEnter={() => setShowControls(true)} />

      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="flex items-center gap-3 text-slate-400">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <span>Đang tải...</span>
          </div>
        </div>
      )}

      <video
        ref={videoRef}
        className="w-full h-full outline-none"
        controls
        autoPlay
        playsInline
        onClick={() => setShowControls(!showControls)}
        onTimeUpdate={() => {
          if (videoRef.current && onProgress) {
            onProgress(videoRef.current.currentTime, videoRef.current.duration || 0);
          }
        }}
      />
    </div>
  );
};
