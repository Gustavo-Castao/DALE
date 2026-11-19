import React, { useEffect, useRef, useState } from 'react';
import {
  Disc3,
  ExternalLink,
  Pause,
  Play,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { LofiPreferences, LofiTrack } from '../types';
import { DEFAULT_LOFI_TRACKS } from '../utils/storage';

interface YTPlayerInstance {
  playVideo: () => void;
  pauseVideo: () => void;
  setVolume: (vol: number) => void;
  loadVideoById: (videoId: string) => void;
  destroy: () => void;
}

declare global {
  interface Window {
    YT?: {
      Player: new (
        element: HTMLElement | string,
        options: {
          height?: string | number;
          width?: string | number;
          videoId: string;
          playerVars?: Record<string, number | string>;
          events?: {
            onReady?: () => void;
            onStateChange?: (event: { data: number }) => void;
            onError?: (event: { data: number }) => void;
          };
        }
      ) => YTPlayerInstance;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface LofiPlayerPanelProps {
  prefs: LofiPreferences;
  onUpdatePrefs: (next: LofiPreferences) => void;
  isFocusRunning: boolean;
}

export const LofiPlayerPanel: React.FC<LofiPlayerPanelProps> = ({
  prefs,
  onUpdatePrefs,
  isFocusRunning,
}) => {
  const tracks: LofiTrack[] = DEFAULT_LOFI_TRACKS;
  const currentTrack =
    tracks.find((t) => t.id === prefs.selectedTrackId) ?? tracks[0];

  const [ytReady, setYtReady] = useState(false);
  const [ytPlaying, setYtPlaying] = useState(false);
  const [ytBuffering, setYtBuffering] = useState(false);
  const [ytError, setYtError] = useState<string | null>(null);

  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const ytPlayerRef = useRef<YTPlayerInstance | null>(null);
  const loadedVideoIdRef = useRef<string>(currentTrack.videoId);

  // Initialize hidden audio-only YouTube IFrame API instance
  useEffect(() => {
    let cancelled = false;

    const initPlayer = () => {
      if (cancelled || !playerContainerRef.current || !window.YT?.Player) return;
      if (ytPlayerRef.current) return;

      const mountNode = document.createElement('div');
      playerContainerRef.current.innerHTML = '';
      playerContainerRef.current.appendChild(mountNode);

      ytPlayerRef.current = new window.YT.Player(mountNode, {
        width: 1,
        height: 1,
        videoId: currentTrack.videoId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          rel: 0,
          playsinline: 1,
        },
        events: {
          onReady: () => {
            if (cancelled) return;
            setYtReady(true);
            setYtError(null);
            ytPlayerRef.current?.setVolume(prefs.ytVolume);
          },
          onStateChange: (event) => {
            if (cancelled) return;
            if (event.data === 1) {
              setYtPlaying(true);
              setYtBuffering(false);
              setYtError(null);
            } else if (event.data === 3) {
              setYtBuffering(true);
            } else if (event.data === 2 || event.data === 0) {
              setYtPlaying(false);
              setYtBuffering(false);
            }
          },
          onError: () => {
            if (cancelled) return;
            setYtPlaying(false);
            setYtBuffering(false);
            setYtError(
              'No se pudo cargar el audio en este momento. Prueba otra pista o ábrela directo en YouTube Music.'
            );
          },
        },
      });
    };

    if (window.YT?.Player) {
      initPlayer();
    } else {
      const existingScript = document.querySelector(
        'script[src="https://www.youtube.com/iframe_api"]'
      );
      if (!existingScript) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        tag.async = true;
        document.body.appendChild(tag);
      }

      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prevCallback?.();
        initPlayer();
      };
    }

    return () => {
      cancelled = true;
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch {
          // Ignore destroy failure
        }
        ytPlayerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Switch track when selectedTrackId changes
  useEffect(() => {
    if (ytReady && ytPlayerRef.current && loadedVideoIdRef.current !== currentTrack.videoId) {
      loadedVideoIdRef.current = currentTrack.videoId;
      setYtError(null);
      setYtBuffering(true);
      ytPlayerRef.current.loadVideoById(currentTrack.videoId);
    }
  }, [currentTrack.videoId, ytReady]);

  // Sync volume
  useEffect(() => {
    if (ytReady && ytPlayerRef.current) {
      ytPlayerRef.current.setVolume(prefs.ytVolume);
    }
  }, [prefs.ytVolume, ytReady]);

  // Auto-play audio when Pomodoro focus starts if enabled
  useEffect(() => {
    if (!prefs.autoPlayOnFocus) return;
    if (isFocusRunning && ytReady && ytPlayerRef.current && !ytPlaying) {
      ytPlayerRef.current.playVideo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocusRunning]);

  const togglePlay = () => {
    if (!ytReady || !ytPlayerRef.current) return;
    if (ytPlaying) {
      ytPlayerRef.current.pauseVideo();
    } else {
      setYtBuffering(true);
      ytPlayerRef.current.playVideo();
    }
  };

  return (
    <aside className="rounded-xl border border-white/10 bg-[#141417] p-5 flex flex-col gap-5 relative overflow-hidden">
      {/* Offscreen 1x1 audio-only YouTube player (no video UI rendered) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-[9999px] top-0 h-px w-px overflow-hidden opacity-0"
      >
        <div ref={playerContainerRef} />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-zinc-900 ${
              ytPlaying ? 'text-white' : 'text-zinc-400'
            }`}
          >
            <Disc3
              className={`h-5 w-5 ${ytPlaying ? 'animate-spin' : ''}`}
              style={{ animationDuration: '6s' }}
            />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-white truncate">
              Audio Lo-Fi & Ondas Alfa
            </h2>
            <p className="text-xs text-zinc-400 truncate">
              {ytPlaying
                ? `Sonando · ${currentTrack.title}`
                : ytBuffering
                ? 'Cargando audio...'
                : 'Solo audio · Listo para reproducir'}
            </p>
          </div>
        </div>

        <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer shrink-0 select-none">
          <input
            type="checkbox"
            checked={prefs.autoPlayOnFocus}
            onChange={(e) =>
              onUpdatePrefs({ ...prefs, autoPlayOnFocus: e.target.checked })
            }
            className="h-3.5 w-3.5 rounded border-white/20 bg-zinc-900 accent-white"
          />
          <span className="whitespace-nowrap">Auto-play</span>
        </label>
      </div>

      {/* Now Playing Audio Card */}
      <div className="rounded-lg border border-white/10 bg-zinc-900/60 p-4 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {currentTrack.title}
            </p>
            <p className="text-xs text-zinc-400 truncate mt-0.5">
              {currentTrack.artist} · {currentTrack.tag}
            </p>
          </div>
          <a
            href={`https://music.youtube.com/watch?v=${currentTrack.videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Abrir en YouTube Music"
            aria-label="Abrir pista en YouTube Music"
            className="text-zinc-400 hover:text-white transition-colors p-1 shrink-0"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>

        {/* Transport & Volume */}
        <div className="flex items-center justify-between gap-4 pt-1">
          <button
            type="button"
            onClick={togglePlay}
            disabled={!ytReady}
            className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-zinc-200 disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
          >
            {ytPlaying ? (
              <>
                <Pause className="h-3.5 w-3.5" />
                <span>Pausar</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" />
                <span>{ytReady ? 'Reproducir' : 'Cargando...'}</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2 flex-1 max-w-[190px]">
            <button
              type="button"
              onClick={() =>
                onUpdatePrefs({
                  ...prefs,
                  ytVolume: prefs.ytVolume === 0 ? 65 : 0,
                })
              }
              aria-label={prefs.ytVolume === 0 ? 'Activar sonido' : 'Silenciar'}
              className="text-zinc-400 hover:text-white cursor-pointer"
            >
              {prefs.ytVolume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={prefs.ytVolume}
              onChange={(e) =>
                onUpdatePrefs({ ...prefs, ytVolume: Number(e.target.value) })
              }
              aria-label="Volumen"
              className="w-full h-1.5 bg-zinc-700 rounded-lg cursor-pointer text-white"
            />
            <span className="font-mono-tabular text-[11px] text-zinc-400 w-7 text-right">
              {prefs.ytVolume}
            </span>
          </div>
        </div>
      </div>

      {ytError && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200 flex items-center justify-between gap-3">
          <span>{ytError}</span>
          <a
            href={`https://music.youtube.com/watch?v=${currentTrack.videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-semibold underline hover:text-white whitespace-nowrap shrink-0"
          >
            <span>Abrir</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}

      {/* 3 Curated Tracks */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-zinc-400">
          Pistas disponibles
        </span>
        <div className="flex flex-col divide-y divide-white/5 rounded-lg border border-white/10 bg-zinc-900/40 overflow-hidden">
          {tracks.map((track, index) => {
            const selected = track.id === currentTrack.id;
            return (
              <button
                key={track.id}
                type="button"
                onClick={() =>
                  onUpdatePrefs({ ...prefs, selectedTrackId: track.id })
                }
                className={`flex items-center justify-between gap-3 px-3.5 py-3 text-left transition-colors cursor-pointer ${
                  selected ? 'bg-white/10' : 'hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono-tabular text-xs text-zinc-500 w-4 shrink-0">
                    0{index + 1}
                  </span>
                  <div className="min-w-0">
                    <p
                      className={`text-xs font-medium truncate ${
                        selected ? 'text-white' : 'text-zinc-300'
                      }`}
                    >
                      {track.title}
                    </p>
                    <p className="text-[11px] text-zinc-500 truncate">
                      {track.artist} · {track.tag}
                    </p>
                  </div>
                </div>
                {selected && (
                  <span className="text-[11px] font-medium text-zinc-200 shrink-0">
                    {ytPlaying ? 'Sonando' : 'Elegida'}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
