"use client";

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { toast } from "sonner";
import { Station, Stream } from "@/services/radioService";
import { generateDescription } from "@/services/aiDescriptionService";
import { descriptionCache } from "@/services/descriptionCache";
import { logger } from "@/lib/logger";
import { audioEngine } from "@/lib/audioVisualizerEngine";
import { addRecentStation } from "@/services/recentStationsService";
import { getProxiedStreamUrl } from "@/lib/utils";

interface RadioPlayerContextType {
  currentStation: Station | null;
  isPlaying: boolean;
  playStation: (
    station: Station,
    streamUrl?: string,
    indexInPlaylist?: number
  ) => void;
  pauseStation: () => void;
  togglePlayPause: () => void;
  isLoading: boolean;
  loadingStationId: string | null;
  error: string | null;
  volume: number;
  setVolume: (volume: number) => void;
  updateCurrentStream: (stationId: string, streamUrl: string) => void;
  setPlaylist: (stations: Station[]) => void;
  playNextStation: () => void;
  playPreviousStation: () => void;
  playlist: Station[];
  currentStationIndex: number | null;
  aiDescription: string | null;
  isGeneratingDescription: boolean;
  descriptionError: string | null;
  getAudioElement: () => HTMLAudioElement | null;
  failedStationIds: string[];
  isSkippingFailed: boolean;
  clearFailedStations: () => void;
  searchScope: 'main' | 'country' | 'genre' | 'top' | 'trending' | 'random';
  setSearchScope: (scope: 'main' | 'country' | 'genre' | 'top' | 'trending' | 'random') => void;
}

const RadioPlayerContext = createContext<RadioPlayerContextType | undefined>(
  undefined
);

const globalAudioRef = { current: null as HTMLAudioElement | null };

const getSupportedAudioFormats = () => {
  const audio = document.createElement('audio');
  const formats: string[] = [];

  if (audio.canPlayType('audio/mpeg') !== '') formats.push('mp3');
  if (audio.canPlayType('audio/ogg') !== '') formats.push('ogg');
  if (audio.canPlayType('audio/wav') !== '') formats.push('wav');
  if (audio.canPlayType('audio/aac') !== '') formats.push('aac');
  if (audio.canPlayType('application/vnd.apple.mpegurl') !== '' ||
      audio.canPlayType('application/x-mpegURL') !== '') formats.push('hls');

  return formats;
};

const selectBestStream = (station: Station): Stream | null => {
  const supportedFormats = getSupportedAudioFormats();
  const streams = station.streams || [];

  const sortedStreams = [...streams].sort((a, b) => b.bitrate - a.bitrate);

  for (const stream of sortedStreams) {
    const url = stream.url.toLowerCase();

    if (url.includes('.mp3') && supportedFormats.includes('mp3')) return stream;
    if (url.includes('.ogg') && supportedFormats.includes('ogg')) return stream;
    if (url.includes('.wav') && supportedFormats.includes('wav')) return stream;
    if (url.includes('.aac') && supportedFormats.includes('aac')) return stream;
    if ((url.includes('.m3u8') || url.includes('.m3u')) && supportedFormats.includes('hls')) return stream;
  }

  return sortedStreams[0] || null;
};

export const RadioPlayerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentStation, setCurrentStation] = useState<Station | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStationId, setLoadingStationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.4);
  const [playlist, setPlaylistState] = useState<Station[]>([]);
  const [currentStationIndex, setCurrentStationIndex] = useState<number | null>(
    null
  );

  const [aiDescription, setAiDescription] = useState<string | null>(null);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [descriptionError, setDescriptionError] = useState<string | null>(null);

  const [failedStationIds, setFailedStationIds] = useState<string[]>([]);
  const [isSkippingFailed, setIsSkippingFailed] = useState(false);
  const [searchScope, setSearchScope] = useState<'main' | 'country' | 'genre' | 'top' | 'trending' | 'random'>('main');
  const autoSkipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAutoSkipTimeout = () => {
    if (autoSkipTimeoutRef.current) {
      clearTimeout(autoSkipTimeoutRef.current);
      autoSkipTimeoutRef.current = null;
    }
  };

  const audioRef = globalAudioRef;
  const playTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playLockRef = useRef(false);
  const playlistRef = useRef<Station[]>([]);
  const currentStationRef = useRef<Station | null>(null);
  const currentStationIndexRef = useRef<number | null>(null);

  useEffect(() => { currentStationRef.current = currentStation; }, [currentStation]);
  useEffect(() => { currentStationIndexRef.current = currentStationIndex; }, [currentStationIndex]);

  const findNextPlayableStation = useCallback(() => {
    const currentIdx = currentStationIndexRef.current;
    const list = playlistRef.current;
    const failedIds = failedStationIds;
    if (list.length === 0) return -1;
    const startIdx = currentIdx !== null ? (currentIdx + 1) % list.length : 0;
    for (let i = 0; i < list.length; i++) {
      const idx = (startIdx + i) % list.length;
      if (!failedIds.includes(list[idx].id)) return idx;
    }
    return -1;
  }, [failedStationIds]);

  const findNextPlayableRef = useRef(findNextPlayableStation);
  useEffect(() => { findNextPlayableRef.current = findNextPlayableStation; }, [findNextPlayableStation]);

  const clearPlayTimeout = () => {
    if (playTimeoutRef.current) {
      clearTimeout(playTimeoutRef.current);
      playTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    playlistRef.current = playlist;
  }, [playlist]);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.crossOrigin = 'anonymous';
      audioRef.current.volume = volume;

      audioRef.current.addEventListener("play", () => {
        setIsPlaying(true);
        setError(null);
      });

      audioRef.current.addEventListener("pause", () => {
        setIsPlaying(false);
      });

      audioRef.current.addEventListener("waiting", () => {
        if (currentStation) {
          setIsLoading(true);
          setLoadingStationId(currentStation.id);
        }
      });

      audioRef.current.addEventListener("playing", () => {
        setIsLoading(false);
        setLoadingStationId(null);
        clearPlayTimeout();
      });

      audioRef.current.addEventListener("error", (e) => {
        setIsLoading(false);
        setLoadingStationId(null);
        setIsPlaying(false);
        clearPlayTimeout();
        const currentId = currentStationRef.current?.id;
        if (currentId) {
          setFailedStationIds(prev => prev.includes(currentId) ? prev : [...prev, currentId]);
          setIsSkippingFailed(true);
          clearAutoSkipTimeout();
          autoSkipTimeoutRef.current = setTimeout(() => {
            const nextIdx = findNextPlayableRef.current();
            if (nextIdx !== -1 && playlistRef.current[nextIdx]) {
              setIsSkippingFailed(false);
              playStation(playlistRef.current[nextIdx], playlistRef.current[nextIdx].currentStreamUrl, nextIdx);
            } else {
              setIsSkippingFailed(false);
              setError("All stations in this list have been tried. Try a different search.");
              try { window.dispatchEvent(new CustomEvent('radioflow:auto-skip-exhausted')); } catch {}
            }
          }, 900);
        }
      });

      audioRef.current.addEventListener("ended", () => {
        setIsPlaying(false);
        setLoadingStationId(null);
        clearPlayTimeout();
      });

      audioRef.current.addEventListener("loadstart", () => {
        if (currentStation) {
          setIsLoading(true);
          setLoadingStationId(currentStation.id);
        }
      });

      audioRef.current.addEventListener("canplay", () => {
        setIsLoading(false);
        setLoadingStationId(null);
      });

      audioRef.current.addEventListener("stalled", () => {
        if (currentStation) {
          setIsLoading(true);
          setLoadingStationId(currentStation.id);
        }
      });

      audioRef.current.addEventListener("suspend", () => {
        if (currentStation) {
          setIsLoading(true);
          setLoadingStationId(currentStation.id);
        }
      });
    }

    if (audioRef.current) {
      audioRef.current.volume = volume;
    }

    return () => {
      clearPlayTimeout();
      clearDescriptionTimer();
      clearAutoSkipTimeout();
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const LAST_FAILURE_KEY = 'lastDescriptionFailure';
  const descriptionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastDescriptionStationIdRef = useRef<string | null>(null);

  const clearDescriptionTimer = useCallback(() => {
    if (descriptionTimerRef.current) {
      clearTimeout(descriptionTimerRef.current);
      descriptionTimerRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const generateStationDescription = useCallback(async (station: Station) => {
    clearDescriptionTimer();

    const now = Date.now();
    const lastFailure = sessionStorage.getItem(LAST_FAILURE_KEY);
    if (lastFailure && (now - parseInt(lastFailure, 10)) < 60000) {
      const fallback = descriptionCache.getFallback(station.name);
      if (fallback) { setAiDescription(fallback); return; }
    }

    if (lastDescriptionStationIdRef.current === station.id) return;
    lastDescriptionStationIdRef.current = station.id;

    const stationForCacheCheck = {
      name: station.name,
      country: station.country,
      genre: station.genre,
      artist: station.artist,
      description: station.description,
    };

    const cachedDescription = descriptionCache.get(stationForCacheCheck);
    if (cachedDescription) {
      setAiDescription(cachedDescription);
      return;
    }

    setAiDescription(null);
    setDescriptionError(null);

    descriptionTimerRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsGeneratingDescription(true);
      try {
        const description = await generateDescription(stationForCacheCheck, controller.signal);
        if (controller.signal.aborted) return;
        setAiDescription(description);
        sessionStorage.removeItem(LAST_FAILURE_KEY);
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        if (err?.response?.status === 402) {
          sessionStorage.setItem(LAST_FAILURE_KEY, String(Date.now()));
          const fallback = descriptionCache.getFallback(station.name);
          if (fallback) setAiDescription(fallback);
        }
        const errorMessage = err.message || "Failed to generate description.";
        setDescriptionError(errorMessage);
      } finally {
        if (!abortControllerRef.current?.signal.aborted) {
          setIsGeneratingDescription(false);
        }
      }
    }, 2000);
  }, [clearDescriptionTimer]);

  const playStation = useCallback(
    async (
      station: Station,
      selectedStreamUrl?: string,
      indexInPlaylist?: number
    ) => {
      if (playLockRef.current) return;
      playLockRef.current = true;

      try {
        if (!audioRef.current) return;

        setFailedStationIds([]);
        setIsSkippingFailed(false);
        clearAutoSkipTimeout();

        let streamToPlay = selectedStreamUrl;
        if (!streamToPlay) {
          const bestStream = selectBestStream(station);
          if (bestStream) {
            streamToPlay = bestStream.url;
          } else {
            toast.error("No playable streams found for this station.");
            return;
          }
        }

        if (
          currentStation?.id === station.id &&
          currentStation.currentStreamUrl === streamToPlay
        ) {
          if (!isPlaying) {
            try {
              await audioRef.current.play();
              setIsPlaying(true);
              setLoadingStationId(null);
              toast.info(`Resumed: ${currentStation?.name}`);
            } catch (err: any) {
              toast.error("Failed to resume playback");
            }
          }
          return;
        }

        setIsLoading(true);
        setLoadingStationId(station.id);
        setError(null);
        clearPlayTimeout();

        playTimeoutRef.current = setTimeout(() => {
          setIsLoading(false);
          setLoadingStationId(null);
          if (audioRef.current && !audioRef.current.paused) {
            audioRef.current.pause();
          }
          const timeoutId = currentStationRef.current?.id;
          if (timeoutId) {
            setFailedStationIds(prev => prev.includes(timeoutId) ? prev : [...prev, timeoutId]);
            setIsSkippingFailed(true);
            clearAutoSkipTimeout();
            autoSkipTimeoutRef.current = setTimeout(() => {
              const nextIdx = findNextPlayableRef.current();
              if (nextIdx !== -1 && playlistRef.current[nextIdx]) {
                setIsSkippingFailed(false);
                playStation(playlistRef.current[nextIdx], playlistRef.current[nextIdx].currentStreamUrl, nextIdx);
              } else {
                setIsSkippingFailed(false);
                setError("All stations in this list have been tried. Try a different search.");
                try { window.dispatchEvent(new CustomEvent('radioflow:auto-skip-exhausted')); } catch {}
              }
            }, 900);
          }
        }, 25000);

        const streamDetails = (station.streams ?? []).find(
          (s) => s.url === streamToPlay
        );
        const bitrateString = streamDetails
          ? `${streamDetails.bitrate}kbps`
          : station.currentBitrate || "Unknown";

        setCurrentStation({
          ...station,
          currentStreamUrl: streamToPlay,
          currentBitrate: bitrateString,
        });
        currentStationRef.current = {
          ...station,
          currentStreamUrl: streamToPlay,
          currentBitrate: bitrateString,
        };
        addRecentStation(station);

        if (indexInPlaylist === undefined) {
          setPlaylistState([station]);
          setCurrentStationIndex(0);
        } else {
          setCurrentStationIndex(indexInPlaylist);
        }

        const proxiedUrl = getProxiedStreamUrl(streamToPlay);
        audioRef.current.src = proxiedUrl;
        audioRef.current.load();
        try {
          audioEngine.connect(audioRef.current);
        } catch {
        }

        try {
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
            await playPromise;
            setIsPlaying(true);
            setLoadingStationId(null);
          }
        } catch (err: any) {
          if (err.name === 'NotAllowedError') {
            toast.info("Please interact with the page first to enable audio playback.");
          } else if (proxiedUrl !== streamToPlay) {
            logger.warn({ proxiedUrl }, "Proxy failed, retrying with original URL");
            audioRef.current.src = streamToPlay;
            audioRef.current.load();
            try {
              await audioRef.current.play();
              setIsPlaying(true);
              setLoadingStationId(null);
              return;
            } catch {}
          }
          setError("Failed to play station. The stream might be unavailable.");
          setIsPlaying(false);
          setIsLoading(false);
          setLoadingStationId(null);
          clearPlayTimeout();
          setFailedStationIds(prev => prev.includes(station.id) ? prev : [...prev, station.id]);
          setIsSkippingFailed(true);
          clearAutoSkipTimeout();
          autoSkipTimeoutRef.current = setTimeout(() => {
            const nextIdx = findNextPlayableRef.current();
            if (nextIdx !== -1 && playlistRef.current[nextIdx]) {
              setIsSkippingFailed(false);
              playStation(playlistRef.current[nextIdx], playlistRef.current[nextIdx].currentStreamUrl, nextIdx);
            } else {
              setIsSkippingFailed(false);
              try { window.dispatchEvent(new CustomEvent('radioflow:auto-skip-exhausted')); } catch {}
            }
          }, 900);
        }
      } finally {
        playLockRef.current = false;
      }
    },
    [currentStation, isPlaying, generateStationDescription]
  );

  const pauseStation = useCallback(() => {
    if (playLockRef.current) return;
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      clearPlayTimeout();
    }
  }, [isPlaying]);

  const togglePlayPause = useCallback(() => {
    if (currentStation) {
      if (isPlaying) {
        pauseStation();
      } else {
        playStation(
          currentStation,
          currentStation.currentStreamUrl,
          currentStationIndex ?? undefined
        );
      }
    } else {
      toast.info("Please select a station to play.");
    }
  }, [currentStation, isPlaying, playStation, pauseStation, currentStationIndex]);

  const updateCurrentStream = useCallback(
    (stationId: string, streamUrl: string) => {
      setCurrentStation((prev) => {
        if (!prev || prev.id !== stationId) return prev;
        const newStream = prev.streams.find((s) => s.url === streamUrl);
        if (!newStream) return prev;
        return {
          ...prev,
          currentStreamUrl: newStream.url,
          currentBitrate: `${newStream.bitrate}kbps`,
        };
      });
    },
    []
  );

  const setPlaylist = useCallback((stations: Station[]) => {
    setPlaylistState(stations);
    if (currentStation && stations.length > 0) {
      const index = stations.findIndex(s => s.id === currentStation.id);
      if (index !== -1) {
        setCurrentStationIndex(index);
      } else {
        setCurrentStationIndex(null);
      }
    }
  }, [currentStation]);

  const clearFailedStations = useCallback(() => {
    setFailedStationIds([]);
  }, []);

  const playNextStation = useCallback(() => {
    if (playlist.length === 0) {
      toast.info("No stations in playlist.");
      return;
    }

    let nextIndex;
    if (currentStationIndex === null) {
      nextIndex = 0;
    } else {
      nextIndex = (currentStationIndex + 1) % playlist.length;
      const startIdx = nextIndex;
      while (failedStationIds.includes(playlist[nextIndex].id)) {
        nextIndex = (nextIndex + 1) % playlist.length;
        if (nextIndex === startIdx) {
          toast.info("All remaining stations have been skipped.");
          return;
        }
      }
    }

    playStation(
      playlist[nextIndex],
      playlist[nextIndex].currentStreamUrl,
      nextIndex
    );
  }, [playlist, currentStationIndex, playStation, failedStationIds]);

  const playPreviousStation = useCallback(() => {
    if (playlist.length === 0) {
      toast.info("No stations in playlist.");
      return;
    }

    let prevIndex;
    if (currentStationIndex === null) {
      prevIndex = 0;
    } else {
      prevIndex = (currentStationIndex - 1 + playlist.length) % playlist.length;
    }

    playStation(
      playlist[prevIndex],
      playlist[prevIndex].currentStreamUrl,
      prevIndex
    );
  }, [playlist, currentStationIndex, playStation]);

  const getAudioElementCb = useCallback(() => audioRef.current, []);

  const contextValue = useMemo(() => ({
    currentStation,
    isPlaying,
    playStation,
    pauseStation,
    togglePlayPause,
    isLoading,
    loadingStationId,
    error,
    volume,
    setVolume,
    updateCurrentStream,
    setPlaylist,
    playNextStation,
    playPreviousStation,
    playlist,
    currentStationIndex,
    aiDescription,
    isGeneratingDescription,
    descriptionError,
    getAudioElement: getAudioElementCb,
    failedStationIds,
    isSkippingFailed,
    clearFailedStations,
    searchScope,
    setSearchScope,
  }), [
    currentStation, isPlaying, playStation, pauseStation, togglePlayPause,
    isLoading, loadingStationId, error, volume, setVolume,
    updateCurrentStream, setPlaylist, playNextStation, playPreviousStation,
    playlist, currentStationIndex, aiDescription, isGeneratingDescription,
    descriptionError, getAudioElementCb,
    failedStationIds, isSkippingFailed, clearFailedStations, searchScope, setSearchScope,
  ]);

  return (
    <RadioPlayerContext.Provider
      value={contextValue}
    >
      {children}
    </RadioPlayerContext.Provider>
  );
};

export const useRadioPlayer = () => {
  const context = useContext(RadioPlayerContext);
  if (context === undefined) {
    throw new Error(
      "useRadioPlayer must be used within a RadioPlayerProvider"
    );
  }
  return context;
};
