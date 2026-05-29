import React, { useState, useEffect, useCallback, useRef } from 'react';
import RadioHeader from "@/components/RadioHeader";
import NowPlayingCard from "@/components/NowPlayingCard";
import StationListSection from "@/components/StationListSection";
import CountrySelectionDialog from "@/components/CountrySelectionDialog";
import NowPlayingNotification from "@/components/NowPlayingNotification";
import SettingsDialog from "@/components/SettingsDialog";
import InfiniteScrollTrigger from "@/components/InfiniteScrollTrigger";
import GenreSelectionDialog from "@/components/GenreSelectionDialog";
import ScrollToButtons from "@/components/ScrollToButtons";
import { useStations, Station, Category, useGenres } from "@/services/radioService";
import { useRadioPlayer } from "@/context/RadioPlayerContext";
import { useFavorites } from "@/services/favoritesService";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import RecentStationsStrip from "@/components/RecentStationsStrip";
import ScrollToPlayerButton from "@/components/ScrollToPlayerButton";
import FixedControls from "@/components/FixedControls";
import SearchOverlay from "@/components/SearchOverlay";
import StationCardSkeleton from "@/components/StationCardSkeleton";
import { useNavigate } from "react-router-dom";

const NOTIFICATION_SETTING_KEY = "showNowPlayingNotifications";

const cleanStationName = (raw: string): string => {
  if (!raw) return '';
  return raw.replace(/[^a-zA-Z0-9\s\u0400-\u04FF\u0500-\u052F\u1E00-\u1EFF]/g, '');
};

interface StationsPageProps {
  title: string;
  label: string;
  stations: Station[];
  loading: boolean;
  error: string | null;
}

const StationsPage: React.FC<StationsPageProps> = ({ title, label, stations, loading, error: trendsError }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>(undefined);
  const [selectedCountry, setSelectedCountry] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(0);
  const [allLoadedStations, setAllLoadedStations] = useState<Station[]>([]);
  const [isCountryDialogOpen, setIsCountryDialogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGenreDialogOpen, setIsGenreDialogOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState<boolean>(() => {
    return localStorage.getItem(NOTIFICATION_SETTING_KEY) ? JSON.parse(localStorage.getItem(NOTIFICATION_SETTING_KEY)!) : true;
  });
  const [isNowPlayingNotificationVisible, setIsNowPlayingNotificationVisible] = useState(false);
  const lastPlayedGenreRef = useRef<string | null>(null);

  const queryClient = useQueryClient();
  const { data: allGenres } = useGenres();
  const fallbackQuery = useStations(undefined, undefined, 0, 100);
  const stationsLoading = fallbackQuery.isLoading;
  const stationsError = fallbackQuery.error;
  const hasFallbackData = (fallbackQuery.data?.length ?? 0) > 0;

  const { currentStation, isPlaying, isLoading: isPlayerLoading } = useRadioPlayer();
  const mainScrollRef = useRef<HTMLElement>(null);
  const playerCardRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { addToFavorites, removeFromFavorites, isStationFavorite } = useFavorites();
  const [isStationFavoriteMap, setIsStationFavoriteMap] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    if (!stations || stations.length === 0) return;
    let cancelled = false;
    const updateFavoritesStatus = async () => {
      const newMap: {[key: string]: boolean} = {};
      for (const station of stations) {
        if (cancelled) return;
        newMap[station.id] = await isStationFavorite(station.id);
      }
      if (!cancelled) setIsStationFavoriteMap(newMap);
    };
    updateFavoritesStatus();
    return () => { cancelled = true; };
  }, [stations, isStationFavorite]);

  const checkFavoriteStatus = async (stationId: string) => {
    const isFav = await isStationFavorite(stationId);
    setIsStationFavoriteMap(prev => ({ ...prev, [stationId]: isFav }));
  };

  const handleToggleFavorite = async (station: Station) => {
    try {
      if (isStationFavoriteMap[station.id]) {
        await removeFromFavorites(station.id);
        toast.success(`${cleanStationName(station.name)} removed from favorites`);
      } else {
        await addToFavorites(station);
        toast.success(`${cleanStationName(station.name)} added to favorites`);
      }
      checkFavoriteStatus(station.id);
    } catch (error: any) {
      console.error(`[${label}] Error toggling favorite:`, error);
      toast.error('Failed to update favorites');
    }
  };

  const handleSelectCountry = (countryName: string) => {
    setSelectedCountry(countryName);
    setSelectedCategory(undefined);
    setSearchQuery("");
    setPage(0);
    setAllLoadedStations([]);
  };

  const handleSelectCategory = (category: Category) => {
    setSelectedCategory(category);
    setSelectedCountry(undefined);
    setSearchQuery("");
    setPage(0);
    setAllLoadedStations([]);
  };

  const handleSelectCategoryFromCard = (genreName: string) => {
    navigate(`/genre/${encodeURIComponent(genreName)}`);
  };

  const handlePlayRandomStation = useCallback(async () => {
    if (allGenres && allGenres.length > 0) {
      const randomIndex = Math.floor(Math.random() * allGenres.length);
      const randomGenre = allGenres[randomIndex];
      if (lastPlayedGenreRef.current !== randomGenre.name) {
        lastPlayedGenreRef.current = randomGenre.name;
        navigate(`/genre/${encodeURIComponent(randomGenre.name)}`);
      } else {
        toast.info("Same genre as last time, try again!");
      }
    } else {
      toast.info("Could not find a random genre.");
    }
  }, [allGenres, navigate]);

  useEffect(() => {
    const handler = () => {
      if (playerCardRef.current && mainScrollRef.current) {
        const playerBottom = playerCardRef.current.offsetTop + playerCardRef.current.offsetHeight;
        mainScrollRef.current.scrollTo({ top: playerBottom + 8, behavior: 'smooth' });
      }
    };
    window.addEventListener('radioflow:scroll-to-player', handler);
    return () => window.removeEventListener('radioflow:scroll-to-player', handler);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLoadMoreGeneralStations = useCallback(() => {
    setPage(prev => prev + 1);
  }, []);

  const handleBrowseCountries = () => setIsCountryDialogOpen(true);

  const handleOpenFavorites = () => navigate("/favorites");

  const resetFilters = useCallback(() => {
    setSelectedCategory(undefined);
    setSelectedCountry(undefined);
    setSearchQuery("");
    setPage(0);
    setAllLoadedStations([]);
    queryClient.removeQueries({ queryKey: ['stations'] });
  }, [queryClient]);

  const handleToggleNotifications = (checked: boolean) => {
    setShowNotifications(checked);
  };

  if (stations.length === 0 && (stationsLoading || loading)) {
    return (
      <div className="flex-1 min-h-0 flex flex-col bg-background">
        <RadioHeader
          onResetFilters={resetFilters}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
        <div className="h-16 shrink-0" />
        <main className="flex-1 min-h-0 container mx-auto p-4 space-y-6 overflow-y-auto pt-[230px] sm:pt-[190px] pb-[116px] relative z-10">
          <div className="mb-2">
            <div className="h-8 w-48 rounded-lg bg-white/5 animate-pulse" />
          </div>
          <div className="backdrop-blur-sm bg-white/[0.02] rounded-2xl border border-white/10 p-0.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex justify-center">
                  <StationCardSkeleton />
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (stations.length === 0 && (stationsError || trendsError)) {
    return (
      <div className="flex-1 min-h-0 flex flex-col bg-background">
        <RadioHeader
          onResetFilters={resetFilters}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
        <div className="h-16 shrink-0" />
        <main className="flex-1 min-h-0 container mx-auto p-4 space-y-6 overflow-y-auto pt-[230px] sm:pt-[190px] pb-[116px] relative z-10">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-destructive text-sm">Error: {stationsError?.message || trendsError || 'Unknown error'}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:opacity-90"
            >
              Retry
            </button>
          </div>
          <div className="backdrop-blur-sm bg-white/[0.02] rounded-2xl border border-white/10 p-0.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex justify-center">
                  <StationCardSkeleton />
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  const isPlayerActive = currentStation || isPlayerLoading;

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-background relative">
      <RadioHeader
        onResetFilters={resetFilters}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
      <FixedControls
        onOpenGenres={() => setIsGenreDialogOpen(true)}
        onOpenCountries={handleBrowseCountries}
        onOpenFavorites={handleOpenFavorites}
        onOpenSearch={() => setIsSearchOpen(true)}
        onPlayRandom={handlePlayRandomStation}
        isPlaying={isPlaying}
      />
      <main
        ref={mainScrollRef as React.RefObject<HTMLElement>}
        className="flex-1 min-h-0 container mx-auto p-4 space-y-6 overflow-y-auto pt-[230px] sm:pt-[190px] pb-[116px] relative z-10"
      >
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">{title}</h1>
        </div>

        {isPlayerActive && (
          <div ref={playerCardRef} className="rounded-2xl border border-white/[0.06] p-0.5">
            <NowPlayingCard />
          </div>
        )}
        <RecentStationsStrip />

        <div className="backdrop-blur-sm bg-white/[0.02] rounded-2xl border border-white/10 p-0.5">
          <StationListSection
            title={title}
            stations={stations}
            isLoading={false}
            onSelectCountry={handleSelectCountry}
            onSelectGenre={handleSelectCategoryFromCard}
            className="mt-0"
          />
        </div>

        <InfiniteScrollTrigger
          onTrigger={handleLoadMoreGeneralStations}
          isLoading={loading}
          hasMore={stations.length < 500}
        />
      </main>

      <CountrySelectionDialog
        isOpen={isCountryDialogOpen}
        onClose={() => setIsCountryDialogOpen(false)}
        onSelectCountry={handleSelectCountry}
        selectedCountry={selectedCountry}
      />
      <SettingsDialog
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        showNotifications={showNotifications}
        onToggleNotifications={handleToggleNotifications}
      />
      <NowPlayingNotification
        station={currentStation}
        isVisible={isNowPlayingNotificationVisible}
        onClose={() => setIsNowPlayingNotificationVisible(false)}
      />
      <GenreSelectionDialog
        isOpen={isGenreDialogOpen}
        onClose={() => setIsGenreDialogOpen(false)}
        onSelectCategory={handleSelectCategory}
        currentSearchQuery={selectedCategory?.name || searchQuery}
      />
      <ScrollToButtons scrollContainerRef={mainScrollRef} />
      {isPlayerActive && <ScrollToPlayerButton scrollContainerRef={mainScrollRef} playerCardRef={playerCardRef} />}
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
};

export default StationsPage;
