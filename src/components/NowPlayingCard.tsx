import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useRadioPlayer } from "@/context/RadioPlayerContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Globe, Play, Pause, Star, StarOff, Loader2, Sparkles, ChevronRight, Radio, ArrowUp, Download } from "lucide-react";
import { shortenCountryName, cleanStationName, isGlowStation } from "@/lib/utils";
import { saveTrack, getAllTracks } from "@/services/trackCacheService";
import type { CachedTrack } from "@/services/trackCacheService";
import { useNavigate } from "react-router-dom";
import StationImagePlaceholder from "./StationImagePlaceholder";
import { useFavorites } from "@/services/favoritesService";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import GoogleIcon from "./GoogleIcon";
import AmbientGlow from "./AmbientGlow";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import AnimatedEqualizer from "./AnimatedEqualizer";

// ==================== SUB-COMPONENTS ====================

// Player Actions Component
const PlayerActions: React.FC<{
  onFavoriteToggle: (e: React.MouseEvent) => Promise<void>;
  onViewDescription: (e: React.MouseEvent) => void;
  isFavorite: boolean;
  isButtonDisabled: boolean;
  isAnimating: boolean;
  aiDescription: string | null;
  descriptionError: string | null;
}> = ({ onFavoriteToggle, onViewDescription, isFavorite, isButtonDisabled, isAnimating, aiDescription, descriptionError }) => (
  <div className="absolute top-3 right-3 z-20 flex gap-2">
    {(aiDescription || descriptionError) && (
      <button
        onClick={onFavoriteToggle}
        className="p-2 rounded-full bg-background/80 backdrop-blur-sm transition-all duration-300 hover:bg-primary/20"
      >
        <Sparkles className="h-6 w-6 text-purple-400" />
      </button>
    )}
    <button
      onClick={onFavoriteToggle}
      disabled={isButtonDisabled}
      className={cn(
        "p-2 rounded-full bg-background/80 backdrop-blur-sm transition-all duration-300",
        isAnimating && "animate-ping scale-125"
      )}
    >
      {isButtonDisabled ? (
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      ) : isFavorite ? (
        <StarOff className="h-6 w-6 text-yellow-400" />
      ) : (
        <Star className="h-6 w-6 text-yellow-400" />
      )}
    </button>
  </div>
);

// Station Image Component
const StationImage: React.FC<{
  stationName: string;
  imageUrl: string;
  isPlaying: boolean;
  isLoading: boolean;
  onTogglePlay: () => void;
}> = ({ stationName, imageUrl, isPlaying, isLoading, onTogglePlay }) => {
  const [imageError, setImageError] = useState(false);
  const GENERIC_IMAGE_URL = "https://picsum.photos/seed/radio/200/200";
  const usePlaceholder = imageError || !imageUrl || imageUrl.includes("picsum.photos") || imageUrl === GENERIC_IMAGE_URL;

  return (
    <div className="relative flex items-center justify-center mb-3">
      <div
        className="relative w-24 h-24 cursor-pointer group"
        onClick={onTogglePlay}
      >
        {usePlaceholder ? (
          <StationImagePlaceholder
            stationName={stationName}
            className="w-full h-full rounded-2xl shadow-lg"
          />
        ) : (
          <img
            src={imageUrl}
            alt={stationName}
            className="w-full h-full rounded-2xl object-cover shadow-lg"
            onError={() => setImageError(true)}
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {isLoading ? (
            <Loader2 className="h-8 w-8 animate-spin text-white drop-shadow-lg" />
          ) : isPlaying ? (
            <Pause className="h-8 w-8 text-white drop-shadow-lg" />
          ) : (
            <Play className="h-8 w-8 text-white drop-shadow-lg ml-1" />
          )}
        </div>
        {isPlaying && (
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[#22C55E]/55 rounded-full shadow-lg shadow-[#22C55E]/30 animate-pulse overflow-hidden">
            <div className="absolute top-[1.5px] left-[2px] w-[3px] h-[2.5px] bg-white/45 rounded-full rotate-[-20deg]" />
            <div className="absolute bottom-[1px] right-[1.5px] w-[2px] h-[2px] bg-white/20 rounded-full" />
          </div>
        )}
      </div>
    </div>
  );
};

// Station Info Component
const StationInfo: React.FC<{
  stationName: string;
  genre: string;
  bitrate: string;
  country: string;
  onGenreClick: (genre: string) => void;
  onCountryClick: (country: string) => void;
}> = ({ stationName, genre, bitrate, country, onGenreClick, onCountryClick }) => (
  <>
    <h3 className={cn("text-xl font-bold w-full whitespace-nowrap overflow-hidden text-ellipsis px-2 tracking-tight drop-shadow-sm", isGlowStation(stationName) && "animate-neon-glow")}>
      {stationName}
    </h3>
    <div className="flex flex-wrap items-center justify-center gap-1.5 text-sm text-muted-foreground px-2">
      <Badge
        variant="secondary"
        className="px-3 py-1 text-xs cursor-pointer bg-white/10 hover:bg-white/20 text-foreground border-0 transition-all duration-200"
        onClick={(e) => { e.stopPropagation(); onGenreClick(genre); }}
      >
        {genre}
      </Badge>
      <span className="px-2 py-1 text-xs border border-white/10 rounded-md text-muted-foreground">
        {bitrate}
      </span>
      {country && (
        <span
          className="px-2 py-1 text-xs cursor-pointer hover:text-[#22C55E] transition-colors flex items-center bg-white/5 rounded-md"
          onClick={(e) => { e.stopPropagation(); onCountryClick(country); }}
        >
          <Globe className="h-3 w-3 mr-1" />
          {shortenCountryName(country)}
        </span>
      )}
    </div>
  </>
);

// Status Indicators Component
const StatusIndicators: React.FC<{
  isGeneratingDescription: boolean;
  descriptionError: string | null;
  aiDescription: string | null;
  isPlaying: boolean;
}> = ({ isGeneratingDescription, descriptionError, aiDescription, isPlaying }) => (
  <>
    <div className="flex items-center justify-center mb-2">
      {isGeneratingDescription && (
        <div className="flex items-center text-xs text-muted-foreground">
          <Sparkles className="h-3 w-3 inline mr-1 animate-pulse" />
          <span>Generating description...</span>
        </div>
      )}
      {descriptionError && (
        <div className="text-xs text-red-500">Failed to generate description</div>
      )}
      {aiDescription && !isGeneratingDescription && (
        <div className="text-xs text-green-500">Description ready</div>
      )}
    </div>
    <div className="flex items-center justify-center gap-4">
      <AnimatedEqualizer isPlaying={isPlaying} className="mx-auto h-10 w-20" />
    </div>
  </>
);

// Description Panel Component
const DescriptionPanel: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  displayedText: string;
  isTyping: boolean;
  isGeneratingBackground: boolean;
  descriptionError: string | null;
}> = ({ isOpen, onClose, displayedText, isTyping, isGeneratingBackground, descriptionError }) => {
  if (!isOpen) return null;

  const processDescription = (text: string) => {
    if (!text) return "";
    return text + " ✨🎵";
  };

  const processedText = processDescription(displayedText);

  return (
    <div className="relative overflow-hidden transition-all duration-700 ease-out w-full md:w-96 animate-fade-in h-[320px]">
      <Card className={cn(
        "h-full shadow-lg border-2 border-purple-500/40 rounded-2xl",
        "bg-gradient-to-br from-gray-900/95 to-black/95",
        "backdrop-blur-md",
        isGeneratingBackground && "animate-pulse"
      )}>
        <CardContent className="p-5 h-full flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-purple-500/30">
            <div className="flex items-center gap-2">
              <Radio className="h-5 w-5 text-purple-400" />
              <span className="text-base font-bold text-purple-300">RADIO DESCRIPTION</span>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-2">
            {isGeneratingBackground && !displayedText ? (
              <div className="space-y-3 py-2">
                {[95, 85, 90, 75, 80].map((width, i) => (
                  <div key={i} className="h-3 bg-purple-500/30 rounded-full animate-pulse" style={{ width: `${width}%`, animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
            ) : displayedText ? (
              <div className="text-base leading-relaxed text-gray-200 animate-fade-in-slow whitespace-pre-wrap">
                {processedText}
                {isTyping && <span className="animate-pulse ml-1 text-purple-400">|</span>}
              </div>
            ) : descriptionError ? (
              <p className="text-base text-red-400 italic">Error: {descriptionError}</p>
            ) : (
              <p className="text-base text-gray-500 italic">Click the radio button to generate description...</p>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-purple-500/30 flex items-center justify-between text-sm text-gray-400">
            <span className="font-medium">
              {isTyping ? "TYPING..." : isGeneratingBackground ? "GENERATING..." : "READY"}
            </span>
            {isGeneratingBackground && (
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ==================== WORM ANIMATION ====================

const WormAnimation: React.FC = () => {
  const BODY = 10;
  const TRAIL = 6;
  const TOTAL = BODY + TRAIL;
  const GAP = 5;
  const SIZE = (i: number) => {
    if (i < BODY) return 3.5 + i * 0.35;
    const t = (i - BODY) / TRAIL;
    return (3.5 + (BODY - 1) * 0.35) * (1 - t * 0.65);
  };
  const OPACITY = (i: number) => {
    if (i < BODY) return 0.85 - i * 0.05;
    const base = 0.85 - (BODY - 1) * 0.05;
    const t = (i - BODY) / TRAIL;
    return Math.max(0, base * (1 - t * 0.85));
  };

  const segmentsRef = useRef<(HTMLDivElement | null)[]>([]);
  const trailRef = useRef<{ x: number; y: number }[]>([]);
  const rafRef = useRef(0);

  useEffect(() => {
    const base = [
      { x: 0.06, y: 0.10 }, { x: 0.25, y: 0.04 }, { x: 0.55, y: 0.04 },
      { x: 0.82, y: 0.10 }, { x: 0.94, y: 0.28 }, { x: 0.96, y: 0.50 },
      { x: 0.92, y: 0.70 }, { x: 0.78, y: 0.88 }, { x: 0.50, y: 0.94 },
      { x: 0.22, y: 0.88 }, { x: 0.08, y: 0.70 }, { x: 0.04, y: 0.50 },
      { x: 0.04, y: 0.28 }, { x: 0.06, y: 0.10 },
    ];
    const randOff = () => (Math.random() - 0.5) * 0.06;
    const waypoints = base.map(wp => ({
      x: Math.max(0.01, Math.min(0.99, wp.x + randOff())),
      y: Math.max(0.01, Math.min(0.99, wp.y + randOff())),
    }));

    let progress = 0;
    const speed = 0.001 + Math.random() * 0.0004;

    const animate = () => {
      progress += speed;
      if (progress >= 1) progress -= 1;

      const total = waypoints.length - 1;
      const pos = progress * total;
      const idx = Math.min(Math.floor(pos), total - 1);
      const frac = pos - idx;
      const p1 = waypoints[idx];
      const p2 = waypoints[idx + 1];

      const headX = (p1.x + (p2.x - p1.x) * frac) * 100;
      const headY = (p1.y + (p2.y - p1.y) * frac) * 100;

      const trail = trailRef.current;
      trail.push({ x: headX, y: headY });
      const maxLen = TOTAL * GAP + 20;
      if (trail.length > maxLen) trail.splice(0, trail.length - maxLen);

      for (let i = 0; i < TOTAL; i++) {
        const idx2 = trail.length - 1 - i * GAP;
        if (idx2 >= 0) {
          const el = segmentsRef.current[i];
          if (el) {
            const p = trail[idx2];
            el.style.left = `${p.x}%`;
            el.style.top = `${p.y}%`;
          }
        }
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
      {Array.from({ length: TOTAL }, (_, i) => (
        <div
          ref={el => { segmentsRef.current[i] = el; }}
          key={i}
          className="absolute rounded-full"
          style={{
            width: `${SIZE(i)}px`,
            height: `${SIZE(i)}px`,
            opacity: OPACITY(i),
            background: i === 0
              ? 'linear-gradient(135deg, #a855f7, #ec4899)'
              : i < BODY
                ? `linear-gradient(135deg, rgba(168,85,247,${0.8 - i * 0.05}), rgba(236,72,153,${0.8 - i * 0.05}))`
                : `linear-gradient(135deg, rgba(168,85,247,${0.3 - (i - BODY) * 0.03}), rgba(236,72,153,${0.3 - (i - BODY) * 0.03}))`,
            boxShadow: i < 3 ? '0 0 6px rgba(168,85,247,0.4)' : 'none',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}
    </div>
  );
};

// ==================== MAIN COMPONENT ====================

const NowPlayingCard: React.FC = () => {
  const {
    currentStation,
    isPlaying,
    isLoading,
    loadingStationId,
    togglePlayPause,
    aiDescription,
    isGeneratingDescription,
    descriptionError,
    getAudioElement,
    isSkippingFailed
  } = useRadioPlayer();

  const { addToFavorites, removeFromFavorites, isStationFavorite } = useFavorites();
  const { user, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  
  const [isFavorite, setIsFavorite] = useState(false);
  const [isCheckingFavorite, setIsCheckingFavorite] = useState(false);
  const [isUpdatingFavorite, setIsUpdatingFavorite] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [isDescriptionDialogOpen, setIsDescriptionDialogOpen] = useState(false);
  
  const [showDescriptionPanel, setShowDescriptionPanel] = useState(false);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isGeneratingBackground, setIsGeneratingBackground] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const [animationStage, setAnimationStage] = useState(0);

  const loginPromptShownRef = useRef(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const descriptionPanelRef = useRef<HTMLDivElement>(null);

  // Check favorite status
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (currentStation && user) {
        setIsCheckingFavorite(true);
        try {
          const favorite = await isStationFavorite(currentStation.id);
          setIsFavorite(favorite);
        } catch (error) {
          console.error("Error checking favorite status:", error);
        } finally {
          setIsCheckingFavorite(false);
        }
      } else if (!user) {
        setIsFavorite(false);
        setIsCheckingFavorite(false);
      }
    };
    checkFavoriteStatus();
  }, [currentStation, isStationFavorite, user]);

  // Handle description panel and typing animation
  useEffect(() => {
    if (aiDescription && currentStation && showDescriptionPanel) {
      setIsGeneratingBackground(true);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(true);
        typeText(aiDescription, 8);
      }, 300);

      return () => {
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      };
    } else {
      setDisplayedText("");
      setIsTyping(false);
      setIsGeneratingBackground(false);
    }
  }, [aiDescription, currentStation, showDescriptionPanel]);

  // Animation sequence
  useEffect(() => {
    if (isTyping && animationStage === 0) {
      setAnimationStage(1);
      animationTimeoutRef.current = setTimeout(() => setAnimationStage(2), 1500);
      animationTimeoutRef.current = setTimeout(() => setAnimationStage(3), 2500);
    }
  }, [isTyping, animationStage]);

  const typeText = (text: string, speed: number) => {
    const processText = (fullText: string) => {
      if (!fullText) return "";
      return fullText + " ✨🎵";
    };

    let index = 0;
    setDisplayedText("");
    const processedText = processText(text);
    const type = () => {
      if (index < processedText.length) {
        setDisplayedText((prev) => prev + processedText.charAt(index));
        index++;
        typingTimeoutRef.current = setTimeout(type, speed);
      } else {
        setIsTyping(false);
        setTimeout(() => setIsGeneratingBackground(false), 2000);
      }
    };
    type();
  };

  const handleFavoriteToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentStation) return;
    if (!user) {
      if (!loginPromptShownRef.current) {
        setShowLoginPrompt(true);
        loginPromptShownRef.current = true;
      }
      return;
    }
    if (isUpdatingFavorite || isCheckingFavorite) return;

    setIsUpdatingFavorite(true);
    setIsAnimating(true);
    
    try {
      if (isFavorite) {
        await removeFromFavorites(currentStation.id);
        setIsFavorite(false);
        toast.success("Removed from favorites");
      } else {
        await addToFavorites(currentStation);
        setIsFavorite(true);
        toast.success("Added to favorites");
      }
    } catch (error: any) {
      console.error("Error updating favorites:", error);
      toast.error(`Failed to update favorites: ${error.message || 'Unknown error'}`);
    } finally {
      setIsUpdatingFavorite(false);
      setTimeout(() => setIsAnimating(false), 500);
    }
  };

  const handleViewDescription = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (aiDescription || descriptionError) {
      setIsDescriptionDialogOpen(true);
    }
  };

  const handleLoginConfirm = async () => {
    setShowLoginPrompt(false);
    await signInWithGoogle();
    loginPromptShownRef.current = false;
  };

  const handleLoginCancel = () => {
    setShowLoginPrompt(false);
    loginPromptShownRef.current = false;
  };

  const handleCountryClick = (country: string) => {
    navigate(`/country/${encodeURIComponent(country)}`);
  };

  const startRecording = () => {
    if (isRecording || !currentStation) return;
    const audio = getAudioElement();
    if (!audio) return;
    try {
      const stream = (audio as any).captureStream?.();
      if (!stream) return;
      recordedChunksRef.current = [];
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
        const track: CachedTrack = {
          id: `${Date.now()}_${currentStation!.id}`,
          name: currentStation!.name.replace(/[^a-zA-Z0-9]/g, '_'),
          stationName: currentStation!.name,
          timestamp: Date.now(),
          size: blob.size,
          blob,
        };
        await saveTrack(track).catch(() => {});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${track.name}_radioflow.webm`;
        a.click();
        URL.revokeObjectURL(url);
      };
      recorder.start();
      setIsRecording(true);
    } catch {}
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleGenreClick = (genre: string) => {
    navigate(`/genre/${encodeURIComponent(genre)}`);
  };

  // Jump to description panel with animation and scroll
  const handleJumpToDescription = () => {
    if (showDescriptionPanel && descriptionPanelRef.current) {
      // Scroll to the description panel
      descriptionPanelRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      
      // Add a quick pulse animation to the description panel
      descriptionPanelRef.current.classList.add('animate-pulse');
      setTimeout(() => descriptionPanelRef.current?.classList.remove('animate-pulse'), 500);
    }
  };

  const getPlayerAnimationClasses = () => {
    switch (animationStage) {
      case 1: return "opacity-100 scale-100 translate-x-0 transition-all duration-500 ease-out";
      case 2: return "opacity-100 scale-100 -translate-x-8 transition-all duration-700 ease-in-out";
      case 3: return "opacity-100 scale-100 -translate-x-8 transition-all duration-700 ease-in-out";
      default: return "opacity-100 scale-100"; // Don't hide by default
    }
  };

  if (!currentStation && !isLoading) {
    return null;
  }

  const cleanedStationName = currentStation ? cleanStationName(currentStation.name) : "";
  const isButtonDisabled = isCheckingFavorite || isUpdatingFavorite;

  return (
    <div className={cn("w-full max-w-4xl mx-auto", isSkippingFailed && "fly-away-container")}>
      <style>{`
        @keyframes flyAwayIcon {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(-30px, -40px) scale(0.6); opacity: 0; }
        }
        @keyframes flyAwayName {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(-25px, -35px) scale(0.7); opacity: 0; }
        }
        @keyframes flyAwayBadges {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(-20px, -30px) scale(0.7); opacity: 0; }
        }
        .fly-away-container .fly-icon {
          animation: flyAwayIcon 0.8s ease-in forwards;
        }
        .fly-away-container .fly-name {
          animation: flyAwayName 0.8s ease-in 0.1s forwards;
        }
        .fly-away-container .fly-badges {
          animation: flyAwayBadges 0.8s ease-in 0.2s forwards;
        }
        
      `}</style>
      <Card className={cn(
        "shadow-lg relative overflow-hidden w-full",
        getPlayerAnimationClasses()
      )}>
        {currentStation?.imageUrl && !currentStation.imageUrl.includes("picsum.photos") ? (
          <div className="absolute inset-0 opacity-30 animate-hue-pulse"
            style={{
              backgroundImage: `url(${currentStation.imageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              willChange: 'transform, filter',
              transform: 'translateZ(0)',
            }}
          />
        ) : currentStation ? (
          <StationImagePlaceholder
            stationName={currentStation.name}
            className="absolute inset-0 w-full h-full rounded-none opacity-40"
          />
        ) : (
          <div className="absolute inset-0 animate-gradient-drift"
            style={{
              background: `linear-gradient(135deg, #1E1B4B 0%, #4338CA 15%, #0F0F23 30%, #312E81 50%, #1E1B4B 65%, #4338CA 80%, #0F0F23 100%)`,
              backgroundSize: '400% 400%',
              willChange: 'background-position',
              transform: 'translateZ(0)',
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F23] via-[#0F0F23]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-pink-500/10 animate-aurora-shift pointer-events-none"
          style={{
            willChange: 'background-position',
            transform: 'translateZ(0)',
          }}
        />
        <AmbientGlow />

        {currentStation && (
          <PlayerActions
            onFavoriteToggle={handleFavoriteToggle}
            onViewDescription={handleViewDescription}
            isFavorite={isFavorite}
            isButtonDisabled={isButtonDisabled}
            isAnimating={isAnimating}
            aiDescription={aiDescription}
            descriptionError={descriptionError}
          />
        )}

        <CardContent className="px-8 py-8 flex flex-col items-center text-center relative z-10 gap-4">
          <WormAnimation />
          {currentStation ? (
            <>
              <div className="fly-icon">
                <StationImage
                  stationName={cleanedStationName}
                  imageUrl={currentStation.imageUrl}
                  isPlaying={isPlaying}
                  isLoading={isLoading}
                  onTogglePlay={togglePlayPause}
                />
              </div>
              <div className="fly-name w-full">
                <StationInfo
                  stationName={cleanedStationName}
                  genre={currentStation.genre}
                  bitrate={currentStation.currentBitrate}
                  country={currentStation.country}
                  onGenreClick={handleGenreClick}
                  onCountryClick={handleCountryClick}
                />
              </div>
              <div className="fly-badges w-full">
                <StatusIndicators
                  isGeneratingDescription={isGeneratingDescription}
                  descriptionError={descriptionError}
                  aiDescription={aiDescription}
                  isPlaying={isPlaying}
                />
              </div>

              <div className="flex items-center justify-center gap-2 mt-2">
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
                    isRecording
                      ? 'bg-red-500/20 border-red-400/40 text-red-300 animate-pulse'
                      : 'bg-white/5 hover:bg-white/10 border-white/10'
                  }`}
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>{isRecording ? 'Recording... tap to stop' : 'Record & Download'}</span>
                </button>
              </div>

              {/* Loading overlay that appears on top of the card content when loading */}
              {isLoading && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-20 rounded-xl">
                  <div className="flex flex-col items-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                    <span className="text-sm text-muted-foreground">Loading station...</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <p className="text-muted-foreground">No station playing</p>
            </div>
          )}
        </CardContent>

        {/* Jump Arrow Button - Shows when description panel is visible */}
        {showDescriptionPanel && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleJumpToDescription}
            className="absolute bottom-4 right-4 z-30 h-10 w-10 rounded-full bg-purple-600 hover:bg-purple-700 text-white shadow-lg animate-bounce"
          >
            <ArrowUp className="h-6 w-6" />
            <span className="sr-only">Jump to description</span>
          </Button>
        )}

        {/* Description Dialog */}
        <Dialog open={isDescriptionDialogOpen} onOpenChange={setIsDescriptionDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>AI Generated Description</DialogTitle>
              <DialogDescription>For station: {cleanedStationName}</DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              {isGeneratingDescription && (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Generating description...</span>
                </div>
              )}
              {descriptionError && (
                <p className="text-red-500 p-4 bg-red-50/10 rounded-md">Error: {descriptionError}</p>
              )}
              {aiDescription && !isGeneratingDescription && (
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{aiDescription}</p>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Login Prompt */}
        <AlertDialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Sign In Required</AlertDialogTitle>
              <AlertDialogDescription>
                You need to be signed in to add stations to your favorites. Would you like to sign in with Google now?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleLoginCancel}>Cancel</AlertDialogCancel>
              <AlertDialogAction disabled className="flex items-center gap-2 opacity-40 cursor-default">
                <GoogleIcon className="h-4 w-4" />
                Sign In with Google
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Card>

      {/* Description Panel */}
      <div ref={descriptionPanelRef}>
        <DescriptionPanel
          isOpen={showDescriptionPanel}
          onClose={() => setShowDescriptionPanel(false)}
          displayedText={displayedText}
          isTyping={isTyping}
          isGeneratingBackground={isGeneratingBackground}
          descriptionError={descriptionError}
        />
      </div>
    </div>
  );
};

export default React.memo(NowPlayingCard);