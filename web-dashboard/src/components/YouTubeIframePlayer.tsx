import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, RotateCcw, X } from 'lucide-react';
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

const getSavedPosition = (vidId: string, itemId?: string): number => {
  try {
    const localDirect = Number(localStorage.getItem('pyq_vid_pos_' + vidId)) || 0;
    const sPos = storageService.getVideoPlaybackPosition(vidId) || 
                 (itemId ? storageService.getVideoPlaybackPosition(itemId) : 0) ||
                 localDirect;
    return Number.isFinite(sPos) && sPos > 2 ? Math.floor(sPos) : 0;
  } catch {
    return 0;
  }
};

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

  // Resume overlay and position UI state
  const initialSaved = getSavedPosition(videoId, videoItemId);
  const [savedTimestamp, setSavedTimestamp] = useState<number>(initialSaved);
  const [showOverlay, setShowOverlay] = useState<boolean>(initialSaved > 2);
  const [, setCurrentTimeDisplay] = useState<number>(initialSaved);

  // Keep refs fresh without triggering re-renders
  videoIdRef.current = videoId;
  videoItemIdRef.current = videoItemId;
  isWatchedRef.current = isWatched;

  // Save current playback time helper (saves to storageService & localStorage)
  const saveCurrentPlaybackTime = useCallback((): number | null => {
    if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
      try {
        const t = playerRef.current.getCurrentTime();
        if (typeof t === 'number' && Number.isFinite(t) && t >= 0) {
          const floored = Math.floor(t);
          const currentVidId = videoIdRef.current;
          const currentItemId = videoItemIdRef.current;

          if (currentVidId) {
            storageService.saveVideoPlaybackPosition(currentVidId, floored);
            try {
              localStorage.setItem('pyq_vid_pos_' + currentVidId, String(floored));
            } catch {}
          }
          if (currentItemId && currentItemId !== currentVidId) {
            storageService.saveVideoPlaybackPosition(currentItemId, floored);
            try {
              localStorage.setItem('pyq_vid_pos_' + currentItemId, String(floored));
            } catch {}
          }

          setCurrentTimeDisplay(floored);
          if (floored > 2) {
            setSavedTimestamp(floored);
          }
          return floored;
        }
      } catch (err) {
        // Player not ready or cross-origin
      }
    }
    return null;
  }, []);

  // Stop 2-second interval
  const stopPlayingInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Start 2-second interval while playing for persistent position tracking
  const startPlayingInterval = useCallback(() => {
    stopPlayingInterval();
    intervalRef.current = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        try {
          const t = playerRef.current.getCurrentTime();
          const d = playerRef.current.getDuration();
          if (typeof t === 'number' && Number.isFinite(t) && t >= 0) {
            const floored = Math.floor(t);
            const currentVidId = videoIdRef.current;
            const currentItemId = videoItemIdRef.current;

            if (currentVidId) {
              storageService.saveVideoPlaybackPosition(currentVidId, floored);
              try {
                localStorage.setItem('pyq_vid_pos_' + currentVidId, String(floored));
              } catch {}
            }
            if (currentItemId && currentItemId !== currentVidId) {
              storageService.saveVideoPlaybackPosition(currentItemId, floored);
              try {
                localStorage.setItem('pyq_vid_pos_' + currentItemId, String(floored));
              } catch {}
            }

            setCurrentTimeDisplay(floored);
            if (floored > 2) {
              setSavedTimestamp(floored);
            }

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
  }, [stopPlayingInterval, onToggleWatched, onShowToast]);

  // Resume playback from saved timestamp
  const handleResume = () => {
    setShowOverlay(false);
    const targetTime = savedTimestamp > 2 ? savedTimestamp : 0;
    if (playerRef.current) {
      try {
        if (typeof playerRef.current.seekTo === 'function') {
          playerRef.current.seekTo(targetTime, true);
        }
        if (typeof playerRef.current.playVideo === 'function') {
          playerRef.current.playVideo();
        }
      } catch (e) {
        console.warn('Error starting playback on resume:', e);
      }
    }
    startPlayingInterval();
    onShowToast(`Resumed playback from ${formatSecondsToTime(targetTime)}`, 'info');
  };

  // Start over from beginning (00:00)
  const handleStartOver = () => {
    setShowOverlay(false);
    setSavedTimestamp(0);
    setCurrentTimeDisplay(0);

    const vId = videoIdRef.current;
    const vItemId = videoItemIdRef.current;

    storageService.saveVideoPlaybackPosition(vId, 0);
    if (vItemId) {
      storageService.saveVideoPlaybackPosition(vItemId, 0);
    }
    try {
      localStorage.removeItem('pyq_vid_pos_' + vId);
      if (vItemId) {
        localStorage.removeItem('pyq_vid_pos_' + vItemId);
      }
    } catch {}

    if (playerRef.current) {
      try {
        if (typeof playerRef.current.seekTo === 'function') {
          playerRef.current.seekTo(0, true);
        }
        if (typeof playerRef.current.playVideo === 'function') {
          playerRef.current.playVideo();
        }
      } catch (e) {
        console.warn('Error restarting playback:', e);
      }
    }
    startPlayingInterval();
    onShowToast('Started lecture from the beginning (00:00).', 'info');
  };

  // 1. CREATE PLAYER ONCE AND ATTACH EVENT LISTENERS
  useEffect(() => {
    let isDisposed = false;

    // Check saved position for this video
    const startSec = getSavedPosition(videoId, videoItemId);
    if (startSec > 2) {
      setSavedTimestamp(startSec);
      setShowOverlay(true);
    } else {
      setSavedTimestamp(0);
      setShowOverlay(false);
    }

    loadYouTubeIframeApi().then(YT => {
      if (isDisposed || !mountRef.current || !YT || !YT.Player) return;

      // Clean inner div for YouTube API to mount
      mountRef.current.innerHTML = '';
      const childDiv = document.createElement('div');
      childDiv.id = `yt-player-slot-${Date.now()}`;
      childDiv.style.width = '100%';
      childDiv.style.height = '100%';
      mountRef.current.appendChild(childDiv);

      playerRef.current = new YT.Player(childDiv, {
        videoId: videoId,
        playerVars: {
          autoplay: 0, // Keep paused so student can see the clear overlay when saved timestamp exists
          start: startSec > 0 ? startSec : 0,
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
                event.target.pauseVideo();
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
              setShowOverlay(false);
              startPlayingInterval();
            } else if (state === YT.PlayerState.PAUSED) {
              stopPlayingInterval();
              const savedSec = saveCurrentPlaybackTime();
              const pos = savedSec ?? getSavedPosition(videoIdRef.current, videoItemIdRef.current);
              if (pos > 2) {
                setSavedTimestamp(pos);
                setShowOverlay(true);
              }
            } else if (state === YT.PlayerState.ENDED) {
              setShowOverlay(false);
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

    // Event listeners for window/tab switching, backgrounding, and page unload
    // Saves timestamp on visibilitychange and pagehide events
    const handleVisibilityChange = () => {
      saveCurrentPlaybackTime();
      if (document.hidden) {
        stopPlayingInterval();
      } else {
        if (playerRef.current && typeof playerRef.current.getPlayerState === 'function') {
          try {
            if (playerRef.current.getPlayerState() === 1) { // 1 = PLAYING
              startPlayingInterval();
            }
          } catch (e) {}
        }
      }
    };

    const handlePageHide = () => {
      saveCurrentPlaybackTime();
    };

    const handleBeforeUnload = () => {
      saveCurrentPlaybackTime();
    };

    const handleFreeze = () => {
      saveCurrentPlaybackTime();
    };

    const handleWindowBlur = () => {
      saveCurrentPlaybackTime();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('freeze', handleFreeze);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      isDisposed = true;
      stopPlayingInterval();
      saveCurrentPlaybackTime();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('freeze', handleFreeze);
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
  }, [videoId, videoItemId, saveCurrentPlaybackTime, startPlayingInterval, stopPlayingInterval, onToggleWatched]);

  // 2. SWITCH VIDEO ON EXISTING PLAYER WITHOUT DESTROYING IFRAME
  useEffect(() => {
    if (!isPlayerReadyRef.current || !playerRef.current) return;

    // Save previous video position before switching
    saveCurrentPlaybackTime();
    stopPlayingInterval();

    const startSec = getSavedPosition(videoId, videoItemId);
    setSavedTimestamp(startSec);

    if (startSec > 2) {
      setShowOverlay(true);
      try {
        if (typeof playerRef.current.cueVideoById === 'function') {
          playerRef.current.cueVideoById({
            videoId: videoId,
            startSeconds: startSec
          });
        } else if (typeof playerRef.current.loadVideoById === 'function') {
          playerRef.current.loadVideoById({
            videoId: videoId,
            startSeconds: startSec
          });
          playerRef.current.pauseVideo();
        }
      } catch (err) {}
    } else {
      setShowOverlay(false);
      try {
        if (typeof playerRef.current.loadVideoById === 'function') {
          playerRef.current.loadVideoById({
            videoId: videoId,
            startSeconds: 0
          });
        }
      } catch (err) {}
    }
  }, [videoId, videoItemId, saveCurrentPlaybackTime, stopPlayingInterval]);

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
    } else {
      // Returned to view: refresh saved timestamp from storage
      const sPos = getSavedPosition(videoIdRef.current, videoItemIdRef.current);
      if (sPos > 2) {
        setSavedTimestamp(sPos);
      }
    }
  }, [isViewActive, saveCurrentPlaybackTime, stopPlayingInterval]);

  // 4. HANDLE PROGRAMMATIC SEEK (E.G. CLICKING NOTES TIMESTAMP)
  useEffect(() => {
    if (seekTimestampSeconds !== undefined && seekTimestampSeconds !== null && seekTimestampSeconds >= 0) {
      if (isPlayerReadyRef.current && playerRef.current && typeof playerRef.current.seekTo === 'function') {
        try {
          playerRef.current.seekTo(seekTimestampSeconds, true);
          playerRef.current.playVideo();
          setShowOverlay(false);
          setSavedTimestamp(seekTimestampSeconds);
        } catch (e) {
          // ignore
        }
      }
      if (onClearSeek) onClearSeek();
    }
  }, [seekTimestampSeconds, onClearSeek]);

  return (
    <div className="space-y-3">
      {/* Player Frame Container (Never reloaded or recreated) */}
      <div className="aspect-video w-full rounded-2xl sm:rounded-3xl overflow-hidden bg-black shadow-lg relative border border-paper-border dark:border-night-border group">
        <div ref={mountRef} className="w-full h-full" />

        {/* Clear Overlay on Paused Video with Resume Button & Start Over Link */}
        {showOverlay && savedTimestamp > 2 && (
          <div 
            className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-[2px] transition-all duration-300 p-4 sm:p-6 text-center select-none"
            style={{ pointerEvents: 'auto' }}
          >
            {/* Dismiss button to inspect frame/slide if desired */}
            <button
              type="button"
              onClick={() => setShowOverlay(false)}
              className="absolute top-3 right-3 p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Dismiss overlay to view video frame"
              aria-label="Dismiss overlay"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Pulse play badge */}
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mb-3 sm:mb-4 text-amber-400 shadow-lg shadow-amber-500/20">
              <Play className="w-6 h-6 fill-amber-400 ml-0.5" />
            </div>

            {/* Video Context */}
            <div className="max-w-md space-y-1 mb-4 sm:mb-5 px-3">
              <p className="text-xs sm:text-sm font-medium text-slate-300">
                Paused lecture position
              </p>
              <p className="text-sm sm:text-base font-semibold text-white/95 line-clamp-1">
                {videoTitle}
              </p>
            </div>

            {/* Single primary button: "Resume from 12:34" */}
            <button
              type="button"
              onClick={handleResume}
              className="px-6 py-3 sm:px-8 sm:py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-extrabold text-sm sm:text-base flex items-center gap-2.5 shadow-xl shadow-amber-500/30 transition-all cursor-pointer focus:outline-none focus:ring-4 focus:ring-amber-500/40"
            >
              <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-slate-950" />
              <span>Resume from {formatSecondsToTime(savedTimestamp)}</span>
            </button>

            {/* Small "Start over" text link */}
            <button
              type="button"
              onClick={handleStartOver}
              className="mt-3.5 text-xs sm:text-sm text-slate-400 hover:text-white underline underline-offset-4 decoration-slate-600 hover:decoration-white transition-colors cursor-pointer focus:outline-none"
            >
              Start over
            </button>
          </div>
        )}
      </div>

      {/* Playback Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-2xl bg-paper-cardElevated dark:bg-night-cardElevated border border-paper-border dark:border-night-border text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          {savedTimestamp > 2 && (
            <button
              onClick={handleResume}
              className="px-2.5 py-1 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 font-mono font-bold flex items-center gap-1.5 border border-amber-500/30 transition-colors cursor-pointer"
              title={`Resume from ${formatSecondsToTime(savedTimestamp)}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span>Resume from {formatSecondsToTime(savedTimestamp)}</span>
            </button>
          )}

          {savedTimestamp > 2 && (
            <button
              onClick={handleStartOver}
              className="px-2.5 py-1 rounded-xl border border-paper-border dark:border-night-border text-paper-body dark:text-night-text hover:bg-paper-card dark:hover:bg-night-card font-semibold btn-tactile flex items-center gap-1 cursor-pointer"
              title="Start over from beginning"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Start over</span>
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
