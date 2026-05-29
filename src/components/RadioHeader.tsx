import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Settings, User, Menu, LogOut, Star, Globe, Music, Heart, Zap, TrendingUp, BookOpen, Info } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import GoogleIcon from "./GoogleIcon";
import { cn } from "@/lib/utils";
import ProjectGuide from "./ProjectGuide";

interface RadioHeaderProps {
  onToggleSidebar?: () => void;
  onResetFilters: () => void;
  onOpenSettings: () => void;
}

const RadioHeader: React.FC<RadioHeaderProps> = ({ onToggleSidebar, onResetFilters, onOpenSettings, }) => {
  const isMobile = useIsMobile();
  const { user, signInWithGoogle, signOut } = useAuth();
  const navigate = useNavigate();
  
  const [isCompact, setIsCompact] = useState(false);
  
  const topStationsRef = useRef<HTMLButtonElement>(null);
  const trendingRef = useRef<HTMLButtonElement>(null);
  const leftContainerRef = useRef<HTMLDivElement>(null);

  // Check if there's enough space for buttons
  useEffect(() => {
    const checkSpace = () => {
      const topStations = topStationsRef.current;
      const leftContainer = leftContainerRef.current;

      if (!topStations || !leftContainer) return;

      const topRect = topStations.getBoundingClientRect();
      const leftRect = leftContainer.getBoundingClientRect();

      // Check if there's enough space to the right of the left container
      const availableSpace = window.innerWidth - leftRect.right;
      
      // If available space is less than 300px, enable compact mode
      if (availableSpace < 300) {
        setIsCompact(true);
      } else {
        setIsCompact(false);
      }
    };

    checkSpace();
    window.addEventListener('resize', checkSpace);
    
    const intervals = [
      setTimeout(checkSpace, 100),
      setTimeout(checkSpace, 300),
      setTimeout(checkSpace, 500),
      setTimeout(checkSpace, 1000)
    ];

    return () => {
      window.removeEventListener('resize', checkSpace);
      intervals.forEach(clearTimeout);
    };
  }, []);

  const handleFavoritesClick = () => {
    if (!user) {
      toast.error("Please sign in to view favorites");
      return;
    }
    navigate("/favorites");
  };

  const handleTopStationsClick = () => {
    navigate("/genre/top-vote");
  };

  const handleTrendingClick = () => {
    navigate("/genre/trending");
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-[100] glass-premium border-b border-[rgba(99,102,241,0.08)] py-3">
        {/* Liquid gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/[0.03] to-transparent animate-liquid pointer-events-none" 
             style={{ backgroundSize: '200% 100%' }} />
        {/* Aurora accent line at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-400/20 to-transparent" />
        
        <div className="container mx-auto px-2 sm:px-4 relative z-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0">
            {/* Left side: Logo and description */}
            <div className="flex items-center gap-2 min-w-0 flex-shrink" ref={leftContainerRef}>
              {isMobile && onToggleSidebar && (
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="lg:hidden">
                      <Menu className="h-5 w-5" />
                      <span className="sr-only">Toggle Menu</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-64 p-4">
                    <h2 className="text-lg font-semibold mb-4">Navigation</h2>
                    <nav className="grid gap-2 text-lg font-medium">
                      <Link to="/" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary">
                        Home
                      </Link>
                      <Link to="/genres" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary">
                        Genres
                      </Link>
                      <button 
                        onClick={handleFavoritesClick}
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary w-full text-left"
                      >
                        Favorites
                      </button>
                    </nav>
                  </SheetContent>
                </Sheet>
              )}
              
              {/* Premium Logo with Chromatic Aberration */}
              <div 
                className="relative group cursor-pointer flex-shrink-0" 
                onClick={() => {
                  const path = window.location.pathname;
                  if (path === '/' || path === '') {
                    try { window.dispatchEvent(new CustomEvent('radioflow:scroll-to-player')); } catch {}
                  } else {
                    navigate('/');
                  }
                }}
              >
                {/* RGB split layers - visible on hover */}
                <span 
                  className="absolute inset-0 text-2xl sm:text-3xl font-bold pointer-events-none select-none transition-all duration-500 opacity-0 group-hover:opacity-30"
                  style={{ 
                    color: '#ff1744',
                    clipPath: 'inset(0 0 0 0)',
                    transform: 'translate(-1.5px, 0)',
                  }}
                  aria-hidden="true"
                >
                  <span className="animate-logo-color-shift">R</span>adio
                  <span className="animate-logo-color-shift" style={{ animationDelay: '3s' }}>F</span>low
                </span>
                <span 
                  className="absolute inset-0 text-2xl sm:text-3xl font-bold pointer-events-none select-none transition-all duration-500 opacity-0 group-hover:opacity-30"
                  style={{ 
                    color: '#00e5ff',
                    clipPath: 'inset(0 0 0 0)',
                    transform: 'translate(1.5px, 0)',
                  }}
                  aria-hidden="true"
                >
                  <span className="animate-logo-color-shift">R</span>adio
                  <span className="animate-logo-color-shift" style={{ animationDelay: '3s' }}>F</span>low
                </span>
                {/* Main logo text */}
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent whitespace-nowrap">
                  <span className={cn("inline-block animate-logo-color-shift")}>R</span>adio
                  <span className={cn("inline-block animate-logo-color-shift")} style={{ animationDelay: '3s' }}>F</span>low
                </h1>
              </div>
              
              {/* Made by Biopasks - always visible in fixed size */}
              <div className="hidden sm:flex flex-col items-start justify-center leading-none whitespace-nowrap flex-shrink-0">
                <span className="text-[10px] text-muted-foreground/70 tracking-wider uppercase">made by</span>
                <span className="font-miami text-lg sm:text-xl text-pink-400 animate-neon-glow">
                  Sanot
                </span>
              </div>
              
              {/* Project Guide Button */}
              <div className="ml-2 flex-shrink-0">
                <ProjectGuide />
              </div>

              {/* Corporate Copyright */}
              <div className="ml-3 flex-shrink-0 hidden lg:flex items-center">
                <div className="relative flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/[0.04] bg-gradient-to-r from-transparent via-white/[0.01] to-transparent">
                  <div className="absolute inset-0 rounded-lg ring-1 ring-inset ring-white/[0.06]" />
                  <span className="text-[10px] font-medium text-muted-foreground/40 tracking-[0.15em] uppercase">
                    &copy; 2026
                  </span>
                  <span className="text-[10px] font-semibold text-muted-foreground/50 tracking-wide">
                    RadioFlow
                  </span>
                  <span className="text-[9px] text-muted-foreground/30 tracking-[0.1em] uppercase hidden 2xl:inline">
                    &middot; All rights reserved
                  </span>
                  <div className="absolute -inset-px rounded-lg opacity-0 hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5" />
                </div>
              </div>
            </div>

            {/* Right side: Navigation and user actions */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 min-w-0 max-w-full overflow-x-auto pb-1">
              {/* Navigation buttons - visible on all screens with adaptive sizing */}
              <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                <Button
                  ref={topStationsRef}
                  variant="ghost"
                  size="sm"
                  onClick={handleTopStationsClick}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 font-semibold tracking-wide transition-all duration-150 flex-shrink-0 whitespace-nowrap rounded-xl",
                    window.location.pathname === '/genre/top-vote' 
                      ? "text-indigo-400/90 bg-indigo-500/[0.07] border border-indigo-500/15" 
                      : "text-muted-foreground/70 border border-transparent hover:bg-white/[0.03]"
                  )}
                >
                  <TrendingUp className={cn("transition-all duration-150", isCompact ? "h-3 w-3" : "h-4 w-4 sm:h-5 sm:w-5")} />
                  <span>Top Stations</span>
                </Button>
                <Button
                  ref={trendingRef}
                  variant="ghost"
                  size="sm"
                  onClick={handleTrendingClick}
                  className={cn(
                    "flex items-center gap-1.5 px-3.5 py-2.5 font-semibold tracking-wide transition-all duration-150 flex-shrink-0 whitespace-nowrap rounded-xl",
                    window.location.pathname === '/genre/trending' 
                      ? "text-amber-400/90 bg-amber-500/[0.07] border border-amber-500/15" 
                      : "text-muted-foreground/70 border border-transparent hover:bg-white/[0.03]"
                  )}
                >
                  <Zap className={cn("transition-all duration-150", isCompact ? "h-3 w-3" : "h-4 w-4 sm:h-5 sm:w-5")} />
                  <span>Trending</span>
                </Button>
              </div>
              
              {/* Favorites button */}
              <Button variant="ghost" size="icon" onClick={handleFavoritesClick} className="hidden sm:flex h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0 glass-card rounded-xl">
                <Star className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="sr-only">Favorites</span>
              </Button>
              
              {/* User Authentication */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0 glass-card">
                      <User className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="sr-only">User menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" sideOffset={5} className="z-[101] glass-premium">
                    <DropdownMenuLabel className="text-muted-foreground">{user.email}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleFavoritesClick}>
                      <Star className="h-4 w-4 mr-2" />
                      Favorites
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onOpenSettings}>
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut} className="text-red-400">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button variant="outline" size="sm" disabled className="h-9 px-3 sm:px-4 sm:h-10 text-sm sm:text-base flex-shrink-0 opacity-50 cursor-not-allowed glass-card rounded-xl">
                  <GoogleIcon className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-2" />
                  <span className="hidden sm:inline">Sign In</span>
                </Button>
              )}
              
              {/* Settings Button */}
              <Button variant="ghost" size="icon" onClick={onOpenSettings} className="hidden sm:flex h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0 glass-card rounded-xl">
                <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="sr-only">Settings</span>
              </Button>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default RadioHeader;