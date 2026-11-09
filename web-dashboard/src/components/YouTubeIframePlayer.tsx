import React, { useEffect, useRef, useState } from 'react';
import { storageService } from '../utils/storageService';

export interface YouTubeIframePlayerProps {
  videoId: string;
  videoItemId: string;
  videoTitle: string;
  youtubeUrl: string;
  isWatched: boolean;
  isViewActive?: boolean;
  seekTimestampSeconds?: number | null;
  onClearSeek?: () => void;
  onToggleWatched: () => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export function formatSecondsToTime(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return '00:00';
  const total = Math.floor(totalSeconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

// Global script loader for YouTube IFrame Player API
let ytApiPromise: Promise<any> | null = null;
function loadYouTubeIframeApi(): Promise<any> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if ((window as any).YT && (window as any).YT.Player) {
    return Promise.resolve((window as any).YT);
  }
  if (ytApiPromise) return ytApiPromise;

  ytApiPromise = new Promise((resolve) => {
    if (!document.getElementById('youtube-iframe-api-script')) {
      const tag = document.createElement('script');
      tag.id = 'youtube-iframe-api-script';
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      } else {
        document.head.appendChild(tag);
      }
    }

    const previousOnReady = (window as any).onYouTubeIframeAPIReady;
    (window as any).onYouTubeIframeAPIReady = () => {
      if (typeof previousOnReady === 'function') previousOnReady();
      resolve((window as any).YT);
    };

    const pollInterval = setInterval(() => {
      if ((window as any).YT && (window as any).YT.Player) {
        clearInterval(pollInterval);
        resolve((window as any).YT);
      }
    }, 100);
  });

  return ytApiPromise;
}

export const YouTubeIframePlayer: React.FC<YouTubeIframePlayerProps> = React.memo(({
  videoId,
  videoItemId,
  videoTitle,
  youtubeUrl,
  isWatched,
  isViewActive = true,
  seekTimestampSeconds,
  onClearSeek,
  onToggleWatched,
  onShowToast
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const isPlayerReadyRef = useRef<boolean>(false);
  const intervalRef = useRef<any>(null);
  const videoIdRef = useRef<string>(videoId);
  const videoItemIdRef = useRef<string>(videoItemId);
  const isWatchedRef = useRef<boolean>(isWatched);

  // Resume position UI state
  const [resumedFromSeconds, setResumedFromSeconds] = useState<number>(0);
  const [currentTimeDisplay, setCurrentTimeDisplay] = useState<number>(0);

  // Keep refs fresh without triggering re-renders
  videoIdRef.current = videoId;
  videoItemIdRef.current = videoItemId;
  isWatchedRef.current = isWatched;

  // Save current time helper
  const saveCurrentPlaybackTime = () => {
    if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
      try {
        const t = playerRef.current.getCurrentTime();
        if (Number.isFinite(t) && t >= 0) {
          storageService.saveVideoPlaybackPosition(videoIdRef.current, t);
          if (videoItemIdRef.current) {
            storageService.saveVideoPlaybackPosition(videoItemIdRef.current, t);
          }
          try {
            localStorage.setItem('pyq_vid_pos_' + videoIdRef.current, String(Math.floor(t)));
          } catch {}
          setCurrentTimeDisplay(t);
        }
      } catch (err) {
        // Player not ready or cross-origin
      }
    }
  };

  // Start 2-second interval while playing for instant resume position tracking
  const startPlayingInterval = () => {
    stopPlayingInterval();
    intervalRef.current = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        try {
          const t = playerRef.current.getCurrentTime();
          const d = playerRef.current.getDuration();
          if (Number.isFinite(t) && t >= 0) {
            storageService.saveVideoPlaybackPosition(videoIdRef.current, t);
            if (videoItemIdRef.current) {
              storageService.saveVideoPlaybackPosition(videoItemIdRef.current, t);
            }
            try {
              localStorage.setItem('pyq_vid_pos_' + videoIdRef.current, String(Math.floor(t)));
            } catch {}
            setCurrentTimeDisplay(t);

            // Automatic 90% watched check
            if (d > 0 && (t / d) >= 0.90 && !isWatchedRef.current) {
              isWatchedRef.current = true;
              onToggleWatched();
              onShowToast('🎉 90% completed! Marked lecture as Watched.', 'success');
            }
          }
        } catch (err) {
          // ignore
        }
      }
    }, 2000);
  };

  const stopPlayingInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // 1. CREATE PLAYER ONCE AND ATTACH EVENT LISTENERS
  useEffect(() => {
    let isDisposed = false;

    // Determine initial start position
    const localDirect = Number(localStorage.getItem('pyq_vid_pos_' + videoId)) || 0;
    const savedPos = storageService.getVideoPlaybackPosition(videoId) || 
                     storageService.getVideoPlaybackPosition(videoItemId) ||
                     localDirect;
    const startSec = savedPos > 2 ? Math.max(0, Math.floor(savedPos - 2)) : (savedPos > 0 ? Math.floor(savedPos) : 0);
    if (startSec > 0) {
      setResumedFromSeconds(startSec);
    }

    loadYouTubeIframeApi().then(YT => {
      if (isDisposed || !mountRef.current || !YT || !YT.Player) return;

      // Create a clean inner div for YouTube API to replace
      mountRef.current.innerHTML = '';
      const childDiv = document.createElement('div');
      childDiv.id = `yt-player-slot-${Date.now()}`;
      childDiv.style.width = '100%';
      childDiv.style.height = '100%';
      mountRef.current.appendChild(childDiv);

      playerRef.current = new YT.Player(childDiv, {
        videoId: videoId,
        playerVars: {
          autoplay: 1,
          start: startSec,
          rel: 0,
          modestbranding: 1,
          playsinline: 1, // iOS / mobile browser inline playback
          enablejsapi: 1,
          origin: window.location.origin
        },
        events: {
          onReady: (event: any) => {
            if (isDisposed) return;
            isPlayerReadyRef.current = true;
            if (startSec > 0) {
              try {
                event.target.seekTo(startSec, true);
              } catch (e) {}
            }
            try {
              const iframe = event.target.getIframe();
              if (iframe) {
                iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
                iframe.setAttribute('allowfullscreen', 'true');
                iframe.style.width = '100%';
                iframe.style.height = '100%';
                iframe.style.border = '0';
              }
            } catch (e) {
              // cross-origin guard
            }
          },
          onStateChange: (event: any) => {
            if (isDisposed) return;
            const state = event.data;
            if (state === YT.PlayerState.PLAYING) {
              startPlayingInterval();
            } else if (state === YT.PlayerState.PAUSED) {
              stopPlayingInterval();
              saveCurrentPlaybackTime();
            } else if (state === YT.PlayerState.ENDED) {
              stopPlayingInterval();
              saveCurrentPlaybackTime();
              if (!isWatchedRef.current) {
                isWatchedRef.current = true;
                onToggleWatched();
              }
            }
          }
        }
      });
    });

    // Event listeners for window/tab switching and page unload
    const handleVisibilityChange = () => {
      if (document.hidden) {
        saveCurrentPlaybackTime();
        stopPlayingInterval();
      }
    };

    const handleBeforeUnload = () => {
      saveCurrentPlaybackTime();
    };

    const handlePageHide = () => {
      saveCurrentPlaybackTime();
    };

    const handleWindowBlur = () => {
      saveCurrentPlaybackTime();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      isDisposed = true;
      stopPlayingInterval();
      saveCurrentPlaybackTime();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('blur', handleWindowBlur);

      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        try {
          playerRef.current.destroy();
        } catch (e) {
          // ignore
        }
        playerRef.current = null;
        isPlayerReadyRef.current = false;
      }
    };
  }, []); // Mounted once per active player lifetime

  // 2. SWITCH VIDEO ON EXISTING PLAYER WITHOUT DESTROYING IFRAME
  useEffect(() => {
    if (!isPlayerReadyRef.current || !playerRef.current) return;

    // Check if the videoId actually changed
    const savedPos = storageService.getVideoPlaybackPosition(videoId) || 
                     storageService.getVideoPlaybackPosition(videoItemId);
    const startSec = savedPos > 2 ? Math.max(0, Math.floor(savedPos - 2)) : 0;
    setResumedFromSeconds(startSec);

    try {
      if (typeof playerRef.current.loadVideoById === 'function') {
        playerRef.current.loadVideoById({
          videoId: videoId,
          startSeconds: startSec
        });
      }
    } catch (err) {
      // player might be busy
    }
  }, [videoId, videoItemId]);

  // 3. HANDLE VIEW VISIBILITY (WHEN SWITCHING TABS INSIDE THE APP)
  useEffect(() => {
    if (!isViewActive) {
      saveCurrentPlaybackTime();
      stopPlayingInterval();
      if (playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
        try {
          playerRef.current.pauseVideo();
        } catch (e) {
          // ignore
        }
      }
    }
  }, [isViewActive]);

  // 4. HANDLE PROGRAMMATIC SEEK (E.G. CLICKING NOTES TIMESTAMP)
  useEffect(() => {
    if (seekTimestampSeconds !== undefined && seekTimestampSeconds !== null && seekTimestampSeconds >= 0) {
      if (isPlayerReadyRef.current && playerRef.current && typeof playerRef.current.seekTo === 'function') {
        try {
          playerRef.current.seekTo(seekTimestampSeconds, true);
          playerRef.current.playVideo();
          setResumedFromSeconds(0);
        } catch (e) {
          // ignore
        }
      }
      if (onClearSeek) onClearSeek();
    }
  }, [seekTimestampSeconds, onClearSeek]);

  // Start Over handler
  const handleStartOver = () => {
    if (isPlayerReadyRef.current && playerRef.current && typeof playerRef.current.seekTo === 'function') {
      try {
        playerRef.current.seekTo(0, true);
        playerRef.current.playVideo();
      } catch (e) {
        // ignore
      }
    }
    storageService.saveVideoPlaybackPosition(videoId, 0);
    storageService.saveVideoPlaybackPosition(videoItemId, 0);
    setResumedFromSeconds(0);
    onShowToast('Rewound video to beginning (00:00).', 'info');
  };

  return (
    <div className="space-y-3">
      {/* Player Frame Container (Never reloaded or recreated) */}
      <div className="aspect-video w-full rounded-2xl sm:rounded-3xl overflow-hidden bg-black shadow-lg relative border border-paper-border dark:border-night-border">
        <div ref={mountRef} className="w-full h-full" />
      </div>

      {/* Playback Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-2xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          {resumedFromSeconds > 0 && (
            <span className="px-2.5 py-1 rounded-xl bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 font-mono font-bold flex items-center gap-1.5 border border-cyan-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
              <span>Resume from {formatSecondsToTime(resumedFromSeconds)}</span>
            </span>
          )}

          {resumedFromSeconds > 0 && (
            <button
              onClick={handleStartOver}
              className="px-2.5 py-1 rounded-xl border border-paper-border dark:border-night-border text-paper-body dark:text-night-text hover:bg-paper-card dark:hover:bg-night-card font-semibold btn-tactile flex items-center gap-1"
              title="Start over from beginning"
            >
              ↺ Start over
            </button>
          )}

          <span className="text-[11px] text-paper-muted dark:text-night-muted font-mono">
            Position auto-saved • Picture-in-picture & Fullscreen enabled
          </span>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={youtubeUrl}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            title="Open in YouTube App for background playback"
          >
            <span>Open in YouTube</span>
            <span className="text-[10px]">↗</span>
          </a>
        </div>
      </div>
    </div>
  );
});
