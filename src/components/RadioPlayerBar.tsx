import React, { useState, useEffect, useRef } from "react";
import { useRadioPlayer } from "@/context/RadioPlayerContext";
import { Button } from "@/components/ui/button";
import {
  Play,
  Pause,
  Loader2,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  Sparkles,
  Radio,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import AnimatedEqualizer from "./AnimatedEqualizer";
import { cn } from "@/lib/utils";
import { cleanStationName, isGlowStation } from "@/lib/utils";
import StationImagePlaceholder from "./StationImagePlaceholder";
import { Card, CardContent } from "@/components/ui/card";

// Marquee component for scrolling text
const Marquee: React.FC<{ text: string; className?: string; speed?: number }> = ({ 
  text, 
  className = "", 
  speed = 20 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current) {
        const { scrollWidth, clientWidth } = containerRef.current;
        setIsOverflowing(scrollWidth > clientWidth);
      }
    };

    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    
    return () => window.removeEventListener('resize', checkOverflow);
  }, [text]);

  useEffect(() => {
    if (isOverflowing) {
      const timer = setTimeout(() => setShouldAnimate(true), 1000);
      return () => clearTimeout(timer);
    } else {
      setShouldAnimate(false);
    }
  }, [isOverflowing]);

  if (!isOverflowing) {
    return (
      <div 
        ref={containerRef}
        className={cn(
          "whitespace-nowrap overflow-hidden text-ellipsis",
          className
        )}
      >
        {text}
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={cn(
        "relative overflow-hidden whitespace-nowrap",
        className
      )}
    >
      <div
        className={cn(
          "inline-block whitespace-nowrap",
          shouldAnimate && "animate-marquee"
        )}
        style={{
          animationDuration: `${text.length / speed}s`,
          animationPlayState: shouldAnimate ? 'running' : 'paused'
        }}
      >
        <span className="inline-block">{text}</span>
        <span className="inline-block mx-4">•</span>
        <span className="inline-block">{text}</span>
      </div>
    </div>
  );
};

const RadioPlayerBar: React.FC = () => {
  const {
    currentStation,
    isPlaying,
    isLoading,
    loadingStationId,
    togglePlayPause,
    volume,
    setVolume,
    playNextStation,
    playPreviousStation,
    playlist,
    currentStationIndex,
    aiDescription,
    isGeneratingDescription,
    descriptionError
  } = useRadioPlayer();

  const [imageError, setImageError] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isGeneratingBackground, setIsGeneratingBackground] = useState(false);
  
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setImageError(false);
  }, [currentStation]);

  // Handle description typing animation
  useEffect(() => {
    if (aiDescription && showDescription) {
      setIsGeneratingBackground(true);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(true);
        typeText(aiDescription, 30);
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
  }, [aiDescription, showDescription]);

  const typeText = (text: string, speed: number) => {
    // Process the text to make it shorter and add emojis
    const processText = (fullText: string) => {
      if (!fullText) return "";
      
      // Take only first 150 characters to make it shorter
      let shortenedText = fullText.substring(0, 150);
      
      // Add thematic emojis based on common keywords
      if (fullText.toLowerCase().includes('vibrant') || fullText.toLowerCase().includes('upbeat') || fullText.toLowerCase().includes('energy')) {
        shortenedText += " 🎵✨";
      } else if (fullText.toLowerCase().includes('relax') || fullText.toLowerCase().includes('smooth') || fullText.toLowerCase().includes('calm')) {
        shortenedText += " ☕😌";
      } else if (fullText.toLowerCase().includes('powerful') || fullText.toLowerCase().includes('rock') || fullText.toLowerCase().includes('explosive')) {
        shortenedText += " 🎸🔥";
      } else if (fullText.toLowerCase().includes('dance') || fullText.toLowerCase().includes('beats') || fullText.toLowerCase().includes('rhythm')) {
        shortenedText += " 💃🎧";
      } else if (fullText.toLowerCase().includes('classical') || fullText.toLowerCase().includes('elegant') || fullText.toLowerCase().includes('timeless')) {
        shortenedText += " 🎻🎭";
      } else {
        // Default emoji if no specific theme detected
        shortenedText += " 🎶🌟";
      }
      
      return shortenedText;
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
        setTimeout(() => setIsGeneratingBackground(false), 1000);
      }
    };
    type();
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0] / 100);
  };

  const toggleMute = () => {
    setVolume(volume === 0 ? 0.4 : 0);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const toggleDescription = () => {
    setShowDescription(!showDescription);
  };

  if (!currentStation) {
    return (
      <div className="fixed left-0 right-0 bottom-0 bg-card border-t py-4 px-6 shadow-lg z-[80] transition-transform duration-300 ease-out translate-y-full">
      </div>
    );
  }

  const cleanedStationName = cleanStationName(currentStation.name);
  const usePlaceholder =
    imageError ||
    !currentStation.imageUrl ||
    currentStation.imageUrl.includes("picsum.photos") ||
    currentStation.imageUrl === "https://picsum.photos/seed/radio/200/200";

  // Enable navigation buttons if there's a playlist with more than one station OR if we have a valid current station index
  const isNavigationDisabled = playlist.length <= 1 && currentStationIndex === null;

  return (
    <div className="fixed left-0 right-0 bottom-0 z-[80]">
      {/* Description Panel - Mirrors NowPlayingCard style */}
      {showDescription && (
        <div className="absolute bottom-full left-0 right-0 mb-2 px-4 flex justify-center animate-fade-in">
          <div className="w-full max-w-4xl">
            <Card className={cn(
              "shadow-lg border-2 border-purple-500/40 rounded-2xl overflow-hidden",
              "bg-gradient-to-br from-gray-900/95 to-black/95",
              "backdrop-blur-md",
              isGeneratingBackground && "animate-pulse"
            )}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-purple-500/30">
                  <div className="flex items-center gap-2">
                    <Radio className="h-4 w-4 text-purple-400" />
                    <span className="text-sm font-bold text-purple-300">RADIO DESCRIPTION</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={toggleDescription}
                    className="h-6 w-6 text-gray-400 hover:text-white transition-colors"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>

                <div className="min-h-[60px]">
                  {isGeneratingDescription && !displayedText ? (
                    <div className="space-y-2 py-2">
                      {[95, 85, 90].map((width, i) => (
                        <div key={i} className="h-2 bg-purple-500/30 rounded-full animate-pulse" 
                             style={{ width: `${width}%`, animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                  ) : displayedText ? (
                    <div className="text-base leading-relaxed text-gray-200 font-bold animate-fade-in-slow uppercase">
                      {displayedText}
                      {isTyping && <span className="animate-pulse ml-1 text-purple-400">|</span>}
                    </div>
                  ) : descriptionError ? (
                    <p className="text-sm text-red-400 italic">Error: {descriptionError}</p>
                  ) : null}
                </div>

                <div className="mt-3 pt-2 border-t border-purple-500/30 flex items-center justify-between text-xs text-gray-400">
                  <span className="font-medium">
                    {isTyping ? "TYPING..." : isGeneratingBackground ? "GENERATING..." : "READY"}
                  </span>
                  {isGeneratingBackground && (
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" 
                             style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Main Player Bar */}
      <div className="bg-card border-t py-4 px-6 shadow-lg transition-transform duration-300 ease-out translate-y-0 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          {!usePlaceholder ? (
            <div className="w-full h-full" style={{ backgroundImage: `url(${currentStation.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
          ) : (
            <StationImagePlaceholder stationName={cleanedStationName} className="w-full h-full rounded-none" />
          )}
        </div>
        <div className="container mx-auto flex items-center justify-between gap-6 relative z-10">
          {/* Left: Image and Info */}
          <div className="flex items-center gap-4 flex-grow min-w-0 max-w-[calc(50%-100px)] sm:max-w-[calc(50%-150px)] md:max-w-[300px] lg:max-w-none lg:flex-1">
            <div className="flex-shrink-0 w-16 h-16 relative">
              {usePlaceholder ? (
                <StationImagePlaceholder
                  stationName={cleanedStationName}
                  className="w-full h-full rounded-md"
                />
              ) : (
                <img
                  src={currentStation.imageUrl}
                  alt={cleanedStationName}
                  className="w-full h-full rounded-md object-cover"
                  onError={handleImageError}
                />
              )}
              {/* Description Toggle Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleDescription}
                className={cn(
                  "absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-lg transition-all duration-300",
                  showDescription 
                    ? "bg-purple-600 text-white hover:bg-purple-700" 
                    : "bg-gray-800 text-purple-400 hover:bg-gray-700 hover:text-purple-300",
                  (aiDescription || isGeneratingDescription) && "animate-pulse"
                )}
                disabled={!aiDescription && !isGeneratingDescription}
              >
                {isGeneratingDescription ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3" />
                )}
                <span className="sr-only">Toggle Description</span>
              </Button>
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className={cn("text-base font-semibold truncate lg:whitespace-normal lg:overflow-visible", isGlowStation(cleanedStationName) && "animate-neon-glow")}>
                {cleanedStationName}
              </span>
              <span className="text-sm text-muted-foreground truncate">
                {currentStation.artist || currentStation.genre} ({currentStation.currentBitrate})
              </span>
              {/* Status Indicators */}
              <div className="flex flex-col mt-1 min-h-[1.25rem]">
                {isGeneratingDescription && !showDescription && (
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Sparkles className="h-3 w-3 mr-1 animate-pulse" />
                    <span>Generating description...</span>
                  </div>
                )}
                {descriptionError && !showDescription && (
                  <div className="text-xs text-red-500 truncate">
                    Failed to generate description
                  </div>
                )}
                {aiDescription && !isGeneratingDescription && !showDescription && (
                  <div 
                    className="text-xs text-green-500 overflow-hidden relative w-full"
                    title={aiDescription}
                  >
                    {/* Marquee for long text - Slowed down by 3x (speed 5 instead of 15) */}
                    <Marquee 
                      text={aiDescription} 
                      className="text-xs text-green-500 font-bold"
                      speed={5}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Center: Controls */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={playPreviousStation}
              disabled={false}
              className="h-12 w-12 rounded-full text-primary/60 hover:text-primary hover:bg-primary/5 transition-all duration-200"
            >
              <SkipBack className="h-6 w-6" />
              <span className="sr-only">Previous Station</span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={togglePlayPause}
              disabled={false} /* Always allow play/pause regardless of loading state */
              className="h-16 w-16 rounded-full border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors duration-200"
            >
              {loadingStationId === currentStation?.id ? (
                <Loader2 className="h-10 w-10 animate-spin" />
              ) : isPlaying ? (
                <Pause
                  className={cn("h-10 w-10", isPlaying && "animate-pulse-only")}
                />
              ) : (
                <Play className="h-10 w-10" />
              )}
              <span className="sr-only">
                {loadingStationId === currentStation?.id ? "Loading" : isPlaying ? "Pause" : "Play"}
              </span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={playNextStation}
              disabled={false}
              className="h-12 w-12 rounded-full text-primary/60 hover:text-primary hover:bg-primary/5 transition-all duration-200"
            >
              <SkipForward className="h-6 w-6" />
              <span className="sr-only">Next Station</span>
            </Button>
          </div>

          {/* Right: Equalizer and Volume */}
          <div className="flex items-center gap-4 flex-grow-0 min-w-0 justify-end">
            <AnimatedEqualizer isPlaying={isPlaying} className="h-8 w-12" />
            <div className="hidden md:flex items-center w-32 gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMute}
                className="h-10 w-10"
              >
                {volume === 0 ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
                <span className="sr-only">Toggle Mute</span>
              </Button>
              <Slider
                value={[volume * 100]}
                max={100}
                step={1}
                onValueChange={handleVolumeChange}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RadioPlayerBar;