"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useChat } from "@/context/ChatContext";
import { Shuffle, Tag, Volume2, VolumeX, Globe, Star, Search, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRadioPlayer } from "@/context/RadioPlayerContext";
import { useGenres } from "@/services/radioService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";

interface FixedControlsProps {
  onOpenGenres: () => void;
  onOpenCountries: () => void;
  onOpenFavorites: () => void;
  onOpenSearch?: () => void;
  isPlaying: boolean;
  onPlayRandom?: () => void;
}

const FixedControls: React.FC<FixedControlsProps> = ({
  onOpenGenres,
  onOpenCountries,
  onOpenFavorites,
  onOpenSearch,
  isPlaying,
  onPlayRandom,
}) => {
  const { volume, setVolume } = useRadioPlayer();
  const { openChat } = useChat();
  const { data: allGenres } = useGenres();
  const [isVolumeModalOpen, setIsVolumeModalOpen] = useState(false);
  const [showChat, setShowChat] = useState(false);

  const handleVolumeSliderChange = (value: number[]) => {
    setVolume(value[0] / 100);
  };

  // Touch event handlers for smooth scrolling on touch devices
  const handleTouchStart = (e: React.TouchEvent) => {
    // Store initial touch position
    const touch = e.touches[0];
    (e.currentTarget as any).initialTouchY = touch.clientY;
    (e.currentTarget as any).isScrolling = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const initialTouchY = (e.currentTarget as any).initialTouchY;
    
    if (!initialTouchY) return;

    const deltaY = Math.abs(touch.clientY - initialTouchY);
    
    // If significant vertical movement detected, it's a scroll
    if (deltaY > 10) {
      (e.currentTarget as any).isScrolling = true;
      // Allow natural scrolling by not preventing default
      // This enables the browser's native touch scrolling
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const isScrolling = (e.currentTarget as any).isScrolling;
    
    // If it was a scroll gesture, do nothing (allow natural behavior)
    if (isScrolling) {
      return;
    }
    
    // If it was a tap (not a scroll), trigger the button action
    const buttonAction = (e.currentTarget as any).data.action;
    if (buttonAction) {
      switch (buttonAction) {
        case 'random':
          onPlayRandom?.();
          break;
        case 'genres':
          onOpenGenres();
          break;
        case 'countries':
          onOpenCountries();
          break;
        case 'search':
          onOpenSearch?.();
          break;
        case 'favorites':
          onOpenFavorites();
          break;
        case 'volume':
          setIsVolumeModalOpen(true);
          break;
      }
    }
  };

  const ringStyle: React.CSSProperties = {
    background: 'conic-gradient(from var(--ring-angle, 0deg), transparent 0deg, rgba(139,92,246,0.4) 50deg, rgba(99,102,241,0.7) 90deg, rgba(139,92,246,0.4) 130deg, transparent 180deg, transparent 360deg)',
    WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 2.5px), #000 calc(100% - 1.5px), #000 100%)',
    mask: 'radial-gradient(farthest-side, transparent calc(100% - 2.5px), #000 calc(100% - 1.5px), #000 100%)',
  };

  return (
    <>
      <style>{`
        @property --ring-angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }
        @keyframes ringWorm {
          from { --ring-angle: 0deg; }
          to { --ring-angle: 360deg; }
        }
        .ring-worm {
          animation: ringWorm 2.5s linear infinite;
        }
        @keyframes ringShake {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          10% { transform: translate(-0.5px, -0.5px) rotate(-1deg); }
          20% { transform: translate(0.5px, 0.3px) rotate(1deg); }
          30% { transform: translate(-0.3px, 0.5px) rotate(-0.5deg); }
          40% { transform: translate(0.4px, -0.3px) rotate(0.5deg); }
          50% { transform: translate(-0.5px, 0.2px) rotate(-1deg); }
          60% { transform: translate(0.3px, -0.5px) rotate(0.5deg); }
          70% { transform: translate(-0.2px, 0.4px) rotate(-0.5deg); }
          80% { transform: translate(0.5px, -0.2px) rotate(1deg); }
          90% { transform: translate(-0.4px, -0.3px) rotate(-0.5deg); }
        }
        .btn-glow {
          position: relative;
          overflow: hidden;
          transition: all 0.4s ease;
        }
        .btn-glow::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 1rem;
          opacity: 0;
          transition: opacity 0.6s ease;
          background: var(--btn-grad, linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.04)));
          background-size: 200% 200%;
          animation: gradShift 4s ease infinite;
        }
        .btn-glow:hover::before {
          opacity: 1;
        }
        .btn-glow:hover .btn-label,
        .btn-glow:hover .btn-icon {
          filter: brightness(1.3);
        }
        @keyframes gradShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
      <div
        className={cn(
          "fixed top-[110px] sm:top-[60px] left-0 right-0 z-[90] bg-gradient-to-r from-card/95 via-background/95 to-card/95 backdrop-blur-xl border-b border-border/30 py-4 px-2 shadow-2xl shadow-primary/10 transition-all duration-500 ease-out"
        )}
      >
        <div className="container mx-auto flex items-center justify-center space-x-3 sm:space-x-4 lg:space-x-5">
          <Button
            variant="ghost"
            size="icon"
            className="btn-glow flex flex-col items-center justify-center gap-1 h-16 w-20 rounded-2xl transition-all duration-400 transform bg-gradient-to-br from-card/80 to-background/80 [&_svg]:size-6 border border-transparent"
            style={{ '--btn-grad': 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(251,191,36,0.04), rgba(217,119,6,0.06))' } as React.CSSProperties}
            onClick={() => onPlayRandom?.()}
            data-action="random"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <Shuffle className="h-6 w-6 text-foreground btn-icon" />
            <span className="btn-label font-bold text-foreground/80 whitespace-nowrap text-xs">Random</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="btn-glow flex flex-col items-center justify-center gap-1 h-16 w-20 rounded-2xl transition-all duration-400 transform bg-gradient-to-br from-card/80 to-background/80 [&_svg]:size-6 border border-transparent"
            style={{ '--btn-grad': 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(99,102,241,0.04), rgba(167,139,250,0.06))' } as React.CSSProperties}
            onClick={onOpenGenres}
            data-action="genres"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <Tag className="h-6 w-6 text-foreground btn-icon" />
            <span className="btn-label font-bold text-foreground/80 whitespace-nowrap text-xs">Genres</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="btn-glow flex flex-col items-center justify-center gap-1 h-16 w-20 rounded-2xl transition-all duration-400 transform bg-gradient-to-br from-card/80 to-background/80 [&_svg]:size-6 border border-transparent"
            style={{ '--btn-grad': 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(52,211,153,0.04), rgba(110,231,183,0.06))' } as React.CSSProperties}
            onClick={onOpenCountries}
            data-action="countries"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <Globe className="h-6 w-6 text-foreground btn-icon" />
            <span className="btn-label font-bold text-foreground/80 whitespace-nowrap text-xs">Country</span>
          </Button>

          <div className="relative">
            <div className="absolute inset-0 rounded-2xl pointer-events-none ring-worm" style={ringStyle} />
            <Button
              variant="ghost"
              size="icon"
              className="btn-glow flex flex-col items-center justify-center gap-1 h-16 w-20 rounded-2xl transition-all duration-400 transform bg-gradient-to-br from-card/80 to-background/80 [&_svg]:size-6 relative border border-transparent"
              style={{ '--btn-grad': 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(129,140,248,0.04), rgba(139,92,246,0.06))' } as React.CSSProperties}
              onClick={() => openChat()}
              data-action="chat"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <Bot className="h-6 w-6 text-foreground btn-icon" />
              <span className="btn-label font-bold text-foreground/80 whitespace-nowrap text-xs">
                <span className="inline-block" style={{ animation: 'ringShake 0.3s ease-in-out infinite' }}>A</span>
                <span className="inline-block" style={{ animation: 'ringShake 0.3s ease-in-out infinite 0.05s' }}>I</span>
                {' Cha'}
                <span className="inline-block" style={{ animation: 'ringShake 0.3s ease-in-out infinite 0.1s' }}>t</span>
              </span>
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="btn-glow flex flex-col items-center justify-center gap-1 h-16 w-20 rounded-2xl transition-all duration-400 transform bg-gradient-to-br from-card/80 to-background/80 [&_svg]:size-6 border border-transparent"
            style={{ '--btn-grad': 'linear-gradient(135deg, rgba(6,182,212,0.08), rgba(34,211,238,0.04), rgba(14,165,233,0.06))' } as React.CSSProperties}
            onClick={onOpenSearch}
            data-action="search"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <Search className="h-6 w-6 text-foreground btn-icon" />
            <span className="btn-label font-bold text-foreground/80 whitespace-nowrap text-xs">Search</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="btn-glow flex flex-col items-center justify-center gap-1 h-16 w-20 rounded-2xl transition-all duration-400 transform bg-gradient-to-br from-card/80 to-background/80 [&_svg]:size-6 border border-transparent"
            style={{ '--btn-grad': 'linear-gradient(135deg, rgba(236,72,153,0.08), rgba(244,114,182,0.04), rgba(219,39,119,0.06))' } as React.CSSProperties}
            onClick={onOpenFavorites}
            data-action="favorites"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <Star className="h-6 w-6 text-foreground btn-icon" />
            <span className="btn-label font-bold text-foreground/80 whitespace-nowrap text-xs">Favorites</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="btn-glow flex flex-col items-center justify-center gap-1 h-16 w-20 rounded-2xl transition-all duration-400 transform bg-gradient-to-br from-card/80 to-background/80 [&_svg]:size-6 border border-transparent"
            style={{ '--btn-grad': 'linear-gradient(135deg, rgba(148,163,184,0.08), rgba(100,116,139,0.04), rgba(203,213,225,0.06))' } as React.CSSProperties}
            onClick={() => setIsVolumeModalOpen(true)}
            data-action="volume"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {volume === 0 ? (
              <VolumeX className="h-6 w-6 text-destructive btn-icon" />
            ) : (
              <Volume2 className="h-6 w-6 text-foreground btn-icon" />
            )}
            <span className="btn-label font-bold text-foreground/80 whitespace-nowrap text-xs">Volume</span>
          </Button>
        </div>
      </div>

      <Dialog open={isVolumeModalOpen} onOpenChange={setIsVolumeModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Adjust Volume</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-center space-x-4">
              {volume === 0 ? (
                <VolumeX className="h-6 w-6 text-red-400" />
              ) : (
                <Volume2 className="h-6 w-6 text-blue-400" />
              )}
              <Slider
                value={[volume * 100]}
                max={100}
                step={1}
                onValueChange={handleVolumeSliderChange}
                className="w-full"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FixedControls;