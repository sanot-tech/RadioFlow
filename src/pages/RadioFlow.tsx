import React, { useState, useEffect, useCallback, useRef } from "react";
import RadioHeader from "@/components/RadioHeader";
import NowPlayingCard from "@/components/NowPlayingCard";
import StationListSection from "@/components/StationListSection";
import RecentStationsStrip from "@/components/RecentStationsStrip";
import CountrySelectionDialog from "@/components/CountrySelectionDialog";
import NowPlayingNotification from "@/components/NowPlayingNotification";
import SettingsDialog from "@/components/SettingsDialog";
import InfiniteScrollTrigger from "@/components/InfiniteScrollTrigger";
import GenreSelectionDialog from "@/components/GenreSelectionDialog";
import SearchOverlay from "@/components/SearchOverlay";
import ScrollToButtons from "@/components/ScrollToButtons";
import { useStations, Station, Category, useGenres } from "@/services/radioService";
import { useRadioPlayer } from "@/context/RadioPlayerContext";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { shortenCountryName, cn } from "@/lib/utils";
import { fetchStationsFromApi } from "@/lib/radioApi";
import { useQueryClient } from "@tanstack/react-query";
import FixedControls from "@/components/FixedControls";
import { useNavigate } from "react-router-dom";
import { useTrendingStations } from "@/hooks/useTrends";

const API_FETCH_LIMIT = 20;
const MAX_STATIONS_CAP = 500;
const NOTIFICATION_SETTING_KEY = "showNowPlayingNotifications";

const RadioFlow: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>(undefined);
  const [selectedCountry, setSelectedCountry] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(0);
  const [randomSeed, setRandomSeed] = useState(Date.now());
  const prevSeedRef = useRef(randomSeed);
  const [allLoadedStations, setAllLoadedStations] = useState<Station[]>([]);
  const [isCountryDialogOpen, setIsCountryDialogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGenreDialogOpen, setIsGenreDialogOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState<boolean>(() => {
    return localStorage.getItem(NOTIFICATION_SETTING_KEY) ? JSON.parse(localStorage.getItem(NOTIFICATION_SETTING_KEY)!) : true;
  });
  const [isNowPlayingNotificationVisible, setIsNowPlayingNotificationVisible] = useState(false);
  const queryClient = useQueryClient();
  const { data: allGenres } = useGenres();
  const allStationsQuery = useStations(undefined, undefined, 0, 100, "random", undefined, undefined, 'default', true, randomSeed);
  const allStations = allStationsQuery.data || [];
  const stationsLoading = allStationsQuery.isLoading;
  const stationsError = allStationsQuery.error;
  const { user } = useAuth();
  const { trendingStations, loading: trendsLoading } = useTrendingStations(allStations as any);
  const mainScrollRef = useRef<HTMLElement>(null);
  const playerCardRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const isFilterActive = !!searchQuery || !!selectedCategory || !!selectedCountry;

  const resetFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedCategory(undefined);
    setSelectedCountry(undefined);
    setPage(0);
    setAllLoadedStations([]);
    queryClient.invalidateQueries({ queryKey: ["stations"] });
  }, [queryClient]);

  const {
    data: currentStations,
    isLoading: isLoadingStations,
    isFetching: isFetchingStations,
  } = useStations(
    searchQuery,
    selectedCategory?.searchTags,
    isFilterActive ? page * API_FETCH_LIMIT : 0,
    isFilterActive ? API_FETCH_LIMIT : API_FETCH_LIMIT * 5,
    isFilterActive ? "name" : "random",
    undefined,
    selectedCountry,
    'default',
    !isFilterActive,
    !isFilterActive ? randomSeed : undefined
  );

  const { playStation, isPlaying, currentStation, setPlaylist, isLoading: isPlayerLoading, setSearchScope, searchScope } = useRadioPlayer();
  const playStationRef = useRef(playStation);
  playStationRef.current = playStation;
  const setPlaylistRef = useRef(setPlaylist);
  setPlaylistRef.current = setPlaylist;

  useEffect(() => {
    if (currentStations && Array.isArray(currentStations)) {
      const seedChanged = randomSeed !== prevSeedRef.current;
      prevSeedRef.current = randomSeed;
      if (!isFilterActive && seedChanged) {
        setAllLoadedStations(currentStations.slice(0, MAX_STATIONS_CAP));
      } else {
        setAllLoadedStations((prev) => {
          if (!currentStations || currentStations.length === 0) return prev;
          const newStations = currentStations.filter(
            (newStation) => !prev.some((prevStation) => prevStation.id === newStation.id)
          );
          const combined = [...prev, ...newStations];
          return combined.slice(Math.max(0, combined.length - MAX_STATIONS_CAP));
        });
      }
    }
  }, [currentStations, page, isFetchingStations, isFilterActive]);

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
    if (searchScope !== 'random') {
      setPlaylist(allLoadedStations);
    }
  }, [allLoadedStations, setPlaylist, searchScope]);

  useEffect(() => {
    setSearchScope('main');
  }, [setSearchScope]);

  useEffect(() => {
    const handler = () => {
      setSearchScope(prev => {
        if (prev === 'random') {
          fetchStationsFromApi(undefined, undefined, 0, 30, "random", undefined, undefined, 'default', true, Date.now())
            .then(newStations => {
              if (newStations && newStations.length > 0) {
                const shuffled = [...newStations].sort(() => Math.random() - 0.5);
                setPlaylistRef.current(shuffled);
                playStationRef.current(shuffled[0], undefined, 0);
              }
            });
        }
        return prev;
      });
    };
    window.addEventListener('radioflow:auto-skip-exhausted', handler);
    return () => window.removeEventListener('radioflow:auto-skip-exhausted', handler);
  }, [setSearchScope]);

  const handleSelectCategory = (category: Category) => {
    setSelectedCategory(category);
    setSearchQuery("");
    setSelectedCountry(undefined);
    setPage(0);
    setAllLoadedStations([]);
    setTimeout(() => {
      if (mainScrollRef.current && playerCardRef.current) {
        const playerBottom = playerCardRef.current.offsetTop + playerCardRef.current.offsetHeight;
        mainScrollRef.current.scrollTo({ top: playerBottom + 8, behavior: 'smooth' });
      }
    }, 100);
  };

  const handleSelectCategoryFromCard = useCallback((genreName: string) => {
    const category = allGenres?.find(g => g.name === genreName);
    if (category) {
      handleSelectCategory(category);
    } else {
      toast.error(`Genre "${genreName}" not found.`);
    }
  }, [allGenres]);

  const handleSelectCountry = (countryName: string) => {
    setSelectedCountry(countryName);
    setSearchQuery("");
    setSelectedCategory(undefined);
    setPage(0);
    setAllLoadedStations([]);
    setTimeout(() => {
      if (mainScrollRef.current && playerCardRef.current) {
        const playerBottom = playerCardRef.current.offsetTop + playerCardRef.current.offsetHeight;
        mainScrollRef.current.scrollTo({ top: playerBottom + 8, behavior: 'smooth' });
      }
    }, 100);
  };

  const handleClearCountryFilter = () => {
    setSelectedCountry(undefined);
    setPage(0);
    setAllLoadedStations([]);
  };

  const handlePlayRandomStation = useCallback(async () => {
    setSearchScope('random');
    toast.info("Finding a random station...");
    const stationsForRandom = await fetchStationsFromApi(
      undefined,
      undefined,
      0,
      30,
      "random",
      undefined,
      undefined,
      'default',
      true,
      Date.now(),
    );

    if (stationsForRandom && stationsForRandom.length > 0) {
      const shuffled = [...stationsForRandom].sort(() => Math.random() - 0.5);
      setPlaylist(shuffled);
      playStation(shuffled[0], undefined, 0);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (mainScrollRef.current && playerCardRef.current) {
            const playerBottom = playerCardRef.current.offsetTop + playerCardRef.current.offsetHeight;
            mainScrollRef.current.scrollTo({ top: playerBottom + 8, behavior: 'smooth' });
          } else if (mainScrollRef.current) {
            const frame = mainScrollRef.current.clientHeight * 0.6;
            mainScrollRef.current.scrollTo({ top: frame, behavior: 'smooth' });
          }
        });
      });
    } else {
      toast.info("Could not find a random station. Try again.");
    }
  }, [playStation, setSearchScope, setPlaylist]);

  const handleLoadMoreGeneralStations = useCallback(() => {
    if (allLoadedStations.length < MAX_STATIONS_CAP) {
      if (!isFilterActive) {
        setRandomSeed(Date.now());
      } else {
        setPage((prev) => prev + 1);
      }
    }
  }, [allLoadedStations.length, isFilterActive]);

  const handleBrowseCountries = () => {
    setIsCountryDialogOpen(true);
  };

  const handleOpenFavorites = () => {
    navigate("/favorites");
  };

  const handleToggleNotifications = (checked: boolean) => {
    setShowNotifications(checked);
  };

  const currentListTitle = selectedCountry
    ? `${shortenCountryName(selectedCountry)}`
    : selectedCategory
      ? `${selectedCategory.name}`
      : searchQuery
        ? `Results for "${searchQuery}"`
        : "All Stations";

  const isPlayerActive = currentStation || isPlayerLoading;

  return (
    <div ref={mainScrollRef} className="flex-1 flex flex-col bg-background pt-[210px] sm:pt-[170px] min-h-0 overflow-y-auto">
      <RadioHeader
        onResetFilters={resetFilters}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
      <FixedControls
        onOpenGenres={() => setIsGenreDialogOpen(true)}
        onOpenCountries={handleBrowseCountries}
        onOpenFavorites={handleOpenFavorites}
        onOpenSearch={() => setIsSearchOpen(true)}
        isPlaying={isPlaying}
        onPlayRandom={handlePlayRandomStation}
      />
      {isPlayerActive && (
        <div ref={playerCardRef} className="shrink-0 px-4 my-6">
          <NowPlayingCard />
        </div>
      )}
      <RecentStationsStrip />

      <main className={cn("container mx-auto p-4 pb-16", !isPlayerActive && "mt-4")}>
        
        <div className="space-y-6">
          {/* Removed trending stations display from main page as per requirements */}
          {/* Trending stations are now only displayed on separate pages */}

          <StationListSection
            title={currentListTitle}
            stations={allLoadedStations}
            isLoading={isFetchingStations}
            onSelectCountry={handleSelectCountry}
            onSelectGenre={handleSelectCategoryFromCard}
            className="mt-0"
          />
          <InfiniteScrollTrigger
            onTrigger={handleLoadMoreGeneralStations}
            isLoading={isFetchingStations}
            hasMore={allLoadedStations.length < MAX_STATIONS_CAP}
          />
        </div>
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
      <SearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
      <ScrollToButtons scrollContainerRef={mainScrollRef} playerCardRef={playerCardRef} />
    </div>
  );
};

export default RadioFlow;