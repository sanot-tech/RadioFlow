import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import RadioHeader from "@/components/RadioHeader";
import StationListSection from "@/components/StationListSection";
import InfiniteScrollTrigger from "@/components/InfiniteScrollTrigger";
import NowPlayingNotification from "@/components/NowPlayingNotification";
import SettingsDialog from "@/components/SettingsDialog";
import CountrySelectionDialog from "@/components/CountrySelectionDialog";
import ScrollToButtons from "@/components/ScrollToButtons";
import { useStations, Station, Category, useGenres } from "@/services/radioService";
import { useRadioPlayer } from "@/context/RadioPlayerContext";
import { toast } from "sonner";
import { shortenCountryName, cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import FixedControls from "@/components/FixedControls";
import NowPlayingCard from "@/components/NowPlayingCard";
import RecentStationsStrip from "@/components/RecentStationsStrip";
import ScrollToPlayerButton from "@/components/ScrollToPlayerButton";

const API_FETCH_LIMIT = 20;
const MAX_STATIONS_CAP = 500;
const NOTIFICATION_SETTING_KEY = "showNowPlayingNotifications";

const GenreStationsPage: React.FC = () => {
  const { genreName } = useParams<{ genreName: string }>();
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [randomFetchKey, setRandomFetchKey] = useState(0);
  const [allLoadedStations, setAllLoadedStations] = useState<Station[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCountryDialogOpen, setIsCountryDialogOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState<boolean>(() => {
    return localStorage.getItem(NOTIFICATION_SETTING_KEY) ? JSON.parse(localStorage.getItem(NOTIFICATION_SETTING_KEY)!) : true;
  });
  const [isNowPlayingNotificationVisible, setIsNowPlayingNotificationVisible] = useState(false);

  const queryClient = useQueryClient();
  const { data: allGenres } = useGenres();
  const mainScrollRef = useRef<HTMLElement>(null);
  const playerCardRef = useRef<HTMLDivElement>(null);
  const stationsSectionRef = useRef<HTMLDivElement>(null);
  const hasScrolled = useRef(false);

  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>(undefined);

  useEffect(() => {
    if (allGenres && genreName) {
      const foundCategory = allGenres.find(g => g.name.toLowerCase() === genreName.toLowerCase());
      setSelectedCategory(foundCategory);
    }
  }, [allGenres, genreName]);

  const genreSearchTags = selectedCategory?.searchTags || (genreName ? [genreName.toLowerCase()] : undefined);

  const {
    data: currentStations,
    isLoading: isLoadingStations,
    isFetching: isFetchingStations,
  } = useStations(
    undefined,
    genreSearchTags,
    0,
    API_FETCH_LIMIT * 5,
    "name",
    undefined,
    undefined,
    'default',
    true,
    randomFetchKey,
  );

  const { isPlaying, currentStation, setPlaylist, isLoading: isPlayerLoading } = useRadioPlayer();
  const isPlayerActive = currentStation || isPlayerLoading;

  useEffect(() => {
    setPage(0);
    setRandomFetchKey(0);
    setAllLoadedStations([]);
    queryClient.invalidateQueries({ queryKey: ["stations"] });
  }, [genreName, selectedCategory, queryClient]);

  useEffect(() => {
    console.log(`[GenreStationsPage] Effect for currentStations triggered. Page: ${page}, Data length: ${currentStations?.length}, isFetching: ${isFetchingStations}, randomFetchKey: ${randomFetchKey}`);
    if (currentStations) {
      setAllLoadedStations((prev) => {
        if (!currentStations || currentStations.length === 0) {
          return prev;
        }
        const newStations = currentStations.filter(
          (newStation) => !prev.some((prevStation) => prevStation.id === newStation.id)
        );
        const combined = [...prev, ...newStations];
        console.log(`[GenreStationsPage] Combined allLoadedStations length: ${combined.length}`);
        
        const finalCombined = combined.slice(Math.max(0, combined.length - MAX_STATIONS_CAP));
        return finalCombined;
      });
    }
  }, [currentStations, page, isFetchingStations, randomFetchKey]);

  useEffect(() => {
    if (allLoadedStations.length > 0) {
      setPlaylist(allLoadedStations);
      if (!hasScrolled.current) {
        hasScrolled.current = true;
        setTimeout(() => {
          stationsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  }, [allLoadedStations, setPlaylist]);

  useEffect(() => {
    if (isPlaying && currentStation && showNotifications) {
      setIsNowPlayingNotificationVisible(true);
    } else {
      setIsNowPlayingNotificationVisible(false);
    }
  }, [isPlaying, currentStation, showNotifications]);

  useEffect(() => {
    localStorage.setItem(NOTIFICATION_SETTING_KEY, JSON.stringify(showNotifications));
  }, [showNotifications]);

  const handleSelectCountry = (countryName: string) => {
    navigate(`/country/${encodeURIComponent(countryName)}`);
  };

  const handleSelectGenre = useCallback((genreName: string) => {
    navigate(`/genre/${encodeURIComponent(genreName)}`);
  }, [navigate]);

  const handleLoadMoreStations = useCallback(() => {
    console.log("[GenreStationsPage] Triggered load more stations.");
    if (allLoadedStations.length < MAX_STATIONS_CAP) {
      setRandomFetchKey((prev) => prev + 1);
    } else {
      console.log("[GenreStationsPage] Max stations cap reached.");
    }
  }, [allLoadedStations.length]);

  const handleToggleNotifications = (checked: boolean) => {
    setShowNotifications(checked);
  };

  const handleResetFilters = () => {
    navigate("/");
  };

  const handleOpenFavorites = () => {
    navigate("/favorites");
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-background">
      <RadioHeader
        onResetFilters={handleResetFilters}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
      {/* Separator */}
      <div className="w-full h-px bg-border" />
      <FixedControls
        onOpenGenres={() => navigate('/genres')}
        onOpenCountries={() => setIsCountryDialogOpen(true)}
        onOpenFavorites={handleOpenFavorites}
        isPlaying={isPlaying}
      />
      <main ref={mainScrollRef} className="flex-1 min-h-0 container mx-auto p-4 space-y-6 overflow-y-auto pt-[230px] sm:pt-[190px] pb-[116px]">
        
        {isPlayerActive && (
          <div className="flex flex-col items-center space-y-6">
            <div ref={playerCardRef}>
              <NowPlayingCard />
            </div>
          </div>
        )}
        <RecentStationsStrip />

        <div className="space-y-6" ref={stationsSectionRef}>
          <StationListSection
            title={genreName ? `All Stations in ${genreName}` : "Unknown Genre"}
            stations={allLoadedStations}
            isLoading={isFetchingStations}
            onSelectCountry={handleSelectCountry}
            onSelectGenre={handleSelectGenre}
          />
          <InfiniteScrollTrigger
            onTrigger={handleLoadMoreStations}
            isLoading={isFetchingStations}
            hasMore={allLoadedStations.length < MAX_STATIONS_CAP}
          />
        </div>
      </main>

      <SettingsDialog
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        showNotifications={showNotifications}
        onToggleNotifications={handleToggleNotifications}
      />
      <CountrySelectionDialog
        isOpen={isCountryDialogOpen}
        onClose={() => setIsCountryDialogOpen(false)}
        onSelectCountry={handleSelectCountry}
        selectedCountry={undefined}
      />
      <ScrollToButtons scrollContainerRef={mainScrollRef} />
      {isPlayerActive && <ScrollToPlayerButton scrollContainerRef={mainScrollRef} playerCardRef={playerCardRef} />}
    </div>
  );
};

export default GenreStationsPage;