import React, { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useRadioPlayer } from "@/context/RadioPlayerContext";
import { useFavorites } from "@/services/favoritesService";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { 
  Play, 
  Pause, 
  Star, 
  StarOff, 
  Globe, 
  Loader2, 
  Sparkles,
} from "lucide-react";
import { shortenCountryName, cleanStationName, cn, isGlowStation } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import StationImagePlaceholder from "./StationImagePlaceholder";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface StationCardProps {
  station: {
    id: string;
    name: string;
    artist?: string;
    genre: string;
    country: string;
    imageUrl?: string;
    description?: string;
    streams: { bitrate: number; url: string }[];
    currentStreamUrl: string;
    currentBitrate: string;
  };
  showLoginPrompt: boolean;
  setShowLoginPrompt: (show: boolean) => void;
  onSelectCountry: (countryName: string) => void;
  onSelectGenre: (genreName: string) => void;
  className?: string;
  variant?: 'card' | 'compact';
}

const cleanName = (raw: string): string => {
  if (!raw) return '';
  return raw.replace(/[^a-zA-Z0-9\s\u0400-\u04FF\u0500-\u052F\u1E00-\u1EFF]/g, '');
};

const StationCard: React.FC<StationCardProps> = ({ 
  station, 
  showLoginPrompt, 
  setShowLoginPrompt,
  onSelectCountry,
  onSelectGenre,
  className,
  variant = 'card',
}) => {
  const {
    currentStation,
    isPlaying,
    playStation,
    pauseStation,
    isLoading,
    loadingStationId,
    aiDescription,
    isGeneratingDescription,
    descriptionError
  } = useRadioPlayer();
  const { addToFavorites, removeFromFavorites, isStationFavorite } = useFavorites();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [isFavorite, setIsFavorite] = useState(false);
  const [isCheckingFavorite, setIsCheckingFavorite] = useState(true);
  const [isUpdatingFavorite, setIsUpdatingFavorite] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isDescriptionDialogOpen, setIsDescriptionDialogOpen] = useState(false);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const loginPromptShownRef = useRef(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const isSelected = currentStation?.id === station.id && isPlaying;
  const isThisLoading = loadingStationId === station.id && isLoading;
  const isActive = currentStation?.id === station.id;

  useEffect(() => {
    const checkFavorite = async () => {
      try {
        setIsCheckingFavorite(true);
        const result = await isStationFavorite(station.id);
        setIsFavorite(result);
      } catch {
        setIsFavorite(false);
      } finally {
        setIsCheckingFavorite(false);
      }
    };
    if (user) checkFavorite();
    else {
      setIsFavorite(false);
      setIsCheckingFavorite(false);
    }
  }, [station.id, isStationFavorite, user]);

  const handlePlayClick = useCallback(async () => {
    if (isSelected) {
      pauseStation();
      return;
    }
    if (currentStation?.id === station.id && !isPlaying) {
      playStation(station, undefined, -1);
      return;
    }
    playStation(station, undefined, -1);
  }, [station, playStation, pauseStation, isSelected, currentStation]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handlePlayClick();
    }
  }, [handlePlayClick]);

  const handleToggleFavorite = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    try {
      setIsUpdatingFavorite(true);
      if (isFavorite) {
        await removeFromFavorites(station.id);
        toast.success(`${cleanName(station.name)} removed`);
      } else {
        await addToFavorites(station);
        toast.success(`${cleanName(station.name)} saved`);
      }
      setIsFavorite(!isFavorite);
    } catch {
      toast.error("Failed to update favorites");
    } finally {
      setIsUpdatingFavorite(false);
    }
  }, [station, isFavorite, addToFavorites, removeFromFavorites, user, setShowLoginPrompt]);

  const handleGenreClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectGenre(station.genre);
  }, [station.genre, onSelectGenre]);

  const handleCountryClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectCountry(station.country);
  }, [station.country, onSelectCountry]);

  const handleViewDescription = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDescriptionDialogOpen(true);
  }, []);

  const bgImage = !imageError && station.imageUrl ? station.imageUrl : '';

  if (variant === 'compact') {
    return (
      <div 
        ref={cardRef}
        className={cn(
          "flex items-center gap-3 p-2 rounded-lg transition-all duration-200 cursor-pointer",
          "hover:bg-white/5",
          isSelected && "bg-white/10 ring-1 ring-[#22C55E]/30",
          className
        )}
        onClick={handlePlayClick}
      >
        <div className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0 bg-[#1E1B4B]">
          {bgImage && !imageError ? (
            <img 
              src={bgImage} 
              alt="" 
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <StationImagePlaceholder stationName={station.name} className="w-full h-full" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn("text-sm font-medium text-foreground truncate", isGlowStation(station.name) && "animate-neon-glow")}>{cleanName(station.name)}</p>
          <p className="text-xs text-muted-foreground truncate">{station.genre} · {shortenCountryName(station.country)}</p>
        </div>
        <div className="flex-shrink-0">
          {isThisLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#22C55E]" />
          ) : isSelected ? (
            <Pause className="w-4 h-4 text-[#22C55E]" />
          ) : (
            <Play className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </div>
    );
  }

  return (
    <div ref={cardRef} className={cn("relative w-full max-w-[340px] group", className)}>
      <Card 
        className={cn(
          "w-full h-52 transition-all duration-300 ease-out cursor-pointer overflow-hidden flex flex-col relative",
          "rounded-xl shadow-lg bg-card/80 backdrop-blur-sm",
          "hover:-translate-y-0.5 transition-all duration-200"
        )}
        onClick={handlePlayClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {bgImage && (
          <>
            <div 
              className="absolute inset-0 rounded-xl opacity-30"
              style={{ 
                backgroundImage: `url(${bgImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }} 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F23] via-[#0F0F23]/60 to-[#0F0F23]/40 rounded-xl" />
          </>
        )}
        {!bgImage && (
          <div className="absolute inset-0 bg-gradient-to-br from-[#1E1B4B]/40 via-[#4338CA]/10 to-[#0F0F23] rounded-xl" />
        )}
        {isActive && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#22C55E] to-transparent" />
        )}
        <CardContent className="p-4 h-full flex flex-col relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Badge 
              variant="secondary" 
              className={cn(
                "cursor-pointer transition-all duration-200 rounded-full px-3 py-1 text-xs",
                "bg-white/10 hover:bg-white/20 hover:text-[#22C55E] text-foreground border-0",
                "hover:shadow-lg hover:shadow-[#22C55E]/10"
              )}
              onClick={handleGenreClick}
            >
              {station.genre}
            </Badge>
            <div className={cn(
              "ml-auto flex gap-1 transition-all duration-300",
              isHovered || isSelected ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
            )}>
              {(aiDescription || descriptionError) && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleViewDescription}
                  className="h-7 w-7 p-0 text-[#22C55E]/70 hover:text-[#22C55E] hover:bg-white/10 rounded-full"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleFavorite}
                disabled={isUpdatingFavorite || isCheckingFavorite}
                className={cn(
                  "h-7 w-7 p-0 rounded-full",
                  isFavorite 
                    ? "text-yellow-400 hover:text-yellow-300 hover:bg-white/10" 
                    : "text-muted-foreground hover:text-foreground hover:bg-white/10"
                )}
              >
                {isUpdatingFavorite || isCheckingFavorite ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : isFavorite ? (
                  <Star className="h-3.5 w-3.5 fill-current" />
                ) : (
                  <StarOff className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex-1 flex items-center gap-4 min-w-0">
            <div className="relative flex-shrink-0">
                <div className={cn(
                "w-16 h-16 rounded-xl overflow-hidden",
                "ring-2 ring-white/10 shadow-lg",
                isSelected && "ring-[#22C55E]/30"
              )}>
                {!imageError && bgImage && imageLoaded === false && (
                  <Skeleton className="absolute inset-0 rounded-xl" />
                )}
                {bgImage && !imageError ? (
                  <img 
                    src={bgImage} 
                    alt="" 
                    className="w-full h-full object-cover"
                    onLoad={() => setImageLoaded(true)}
                    onError={() => { setImageError(true); setImageLoaded(false); }}
                  />
                ) : (
                  <StationImagePlaceholder stationName={station.name} className="w-full h-full" />
                )}
                <div className={cn(
                  "absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-200",
                  isHovered ? "opacity-100" : "opacity-0"
                )}>
                  {isThisLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                  ) : isSelected ? (
                    <Pause className="w-6 h-6 text-white drop-shadow-lg" />
                  ) : (
                    <Play className="w-6 h-6 text-white drop-shadow-lg" />
                  )}
                </div>
              </div>
              {isActive && (
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-[#22C55E] rounded-full shadow-lg shadow-[#22C55E]/30" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className={cn("text-sm font-semibold text-foreground leading-tight line-clamp-2", isGlowStation(station.name) && "animate-neon-glow")}>
                {cleanName(station.name)}
              </h3>
              {station.artist && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{station.artist}</p>
              )}
              <div className="flex items-center gap-2 mt-1.5">
                <Badge 
                  variant="outline" 
                  className="cursor-pointer text-[10px] px-2 py-0 h-5 border-white/10 text-muted-foreground hover:text-foreground"
                  onClick={handleCountryClick}
                >
                  <Globe className="w-2.5 h-2.5 mr-1" />
                  {shortenCountryName(station.country)}
                </Badge>
                {station.currentBitrate && (
                  <span className="text-[10px] text-muted-foreground">{station.currentBitrate}</span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-auto pt-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={isSelected ? "secondary" : "default"}
                className={cn(
                  "h-8 px-4 text-xs rounded-full transition-all duration-200",
                  isSelected 
                    ? "bg-[#22C55E]/20 text-[#22C55E] hover:bg-[#22C55E]/30 border border-[#22C55E]/30 animate-pulse-subtle" 
                    : "bg-gradient-to-r from-[#4338CA] to-[#22C55E] text-white hover:opacity-90 shadow-lg shadow-[#22C55E]/20"
                )}
                onClick={(e) => { e.stopPropagation(); handlePlayClick(); }}
              >
                {isThisLoading ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : isSelected ? (
                  <Pause className="w-3.5 h-3.5 mr-1.5" />
                ) : (
                  <Play className="w-3.5 h-3.5 mr-1.5" />
                )}
                {isThisLoading ? 'Loading' : isSelected ? 'Pause' : 'Play'}
              </Button>
            </div>
            {!isCheckingFavorite && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleFavorite}
                disabled={isUpdatingFavorite}
                className={cn(
                  "h-8 w-8 p-0 rounded-full transition-all",
                  isFavorite 
                    ? "text-yellow-400 hover:text-yellow-300 hover:bg-white/10" 
                    : "text-muted-foreground/50 hover:text-foreground hover:bg-white/5"
                )}
              >
                {isUpdatingFavorite ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : isFavorite ? (
                  <Star className="h-3.5 w-3.5 fill-current" />
                ) : (
                  <Star className="h-3.5 w-3.5" />
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDescriptionDialogOpen} onOpenChange={setIsDescriptionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{cleanName(station.name)}</DialogTitle>
            <DialogDescription>AI-generated description</DialogDescription>
          </DialogHeader>
          <div className="p-4">
            {isGeneratingDescription ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating description...
              </div>
            ) : aiDescription ? (
              <p className="text-sm leading-relaxed">{aiDescription}</p>
            ) : descriptionError ? (
              <p className="text-sm text-destructive">Failed to generate description.</p>
            ) : (
              <p className="text-sm text-muted-foreground">No description available.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign In Required</AlertDialogTitle>
            <AlertDialogDescription>
              Sign in with Google to save your favorite stations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled className="flex items-center gap-2 opacity-40 cursor-default">
              <GoogleIcon className="h-4 w-4" />
              Sign In with Google
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export const StationCardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("w-full max-w-[340px]", className)}>
    <Card className="w-full h-52 flex flex-col rounded-xl border border-white/10 shadow-lg bg-card/60">
      <CardContent className="p-4 h-full flex flex-col">
        <div className="flex items-center gap-2 mb-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <div className="ml-auto flex gap-1">
            <Skeleton className="h-7 w-7 rounded-full" />
            <Skeleton className="h-7 w-7 rounded-full" />
          </div>
        </div>
        <div className="flex-1 flex items-center gap-4">
          <Skeleton className="w-16 h-16 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
        <div className="mt-auto pt-2">
          <Skeleton className="h-8 w-20 rounded-full" />
        </div>
      </CardContent>
    </Card>
  </div>
);

export default React.memo(StationCard);
