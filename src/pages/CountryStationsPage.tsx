import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import RadioHeader from "@/components/RadioHeader";
import StationListSection from "@/components/StationListSection";
import InfiniteScrollTrigger from "@/components/InfiniteScrollTrigger";
import NowPlayingNotification from "@/components/NowPlayingNotification";
import SettingsDialog from "@/components/SettingsDialog";
import GenreSelectionDialog from "@/components/GenreSelectionDialog";
import ScrollToButtons from "@/components/ScrollToButtons";
import { useStations, Station, Category, useGenres } from "@/services/radioService";
import { useRadioPlayer } from "@/context/RadioPlayerContext";
import { toast } from "sonner";
import { shortenCountryName, cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tag, X } from "lucide-react";
import FixedControls from "@/components/FixedControls";
import CountrySelectionDialog from "@/components/CountrySelectionDialog";
import NowPlayingCard from "@/components/NowPlayingCard";
import RecentStationsStrip from "@/components/RecentStationsStrip";
import ScrollToPlayerButton from "@/components/ScrollToPlayerButton";

const API_FETCH_LIMIT = 20;
const MAX_STATIONS_CAP = 500;
const NOTIFICATION_SETTING_KEY = "showNowPlayingNotifications";

const CountryStationsPage: React.FC = () => {
  const { countryName } = useParams<{ countryName: string }>();
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [randomFetchKey, setRandomFetchKey] = useState(0);
  const [allLoadedStations, setAllLoadedStations] = useState<Station[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGenreDialogOpen, setIsGenreDialogOpen] = useState(false);
  const [isCountryDialogOpen, setIsCountryDialogOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState<boolean>(() => {
    return localStorage.getItem(NOTIFICATION_SETTING_KEY) ? JSON.parse(localStorage.getItem(NOTIFICATION_SETTING_KEY)!) : true;
  });
  const [isNowPlayingNotificationVisible, setIsNowPlayingNotificationVisible] = useState(false);

  const queryClient = useQueryClient();
  const { data: allGenres } = useGenres();
  const mainScrollRef = useRef<HTMLElement>(null);
  const playerCardRef = useRef<HTMLDivElement>(null);

  const {
    data: currentStations,
    isLoading: isLoadingStations,
    isFetching: isFetchingStations,
  } = useStations(
    undefined,
    undefined,
    0,
    API_FETCH_LIMIT * 5,
    "name",
    undefined,
    countryName,
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
  }, [countryName, queryClient]);

  useEffect(() => {
    console.log(`[CountryStationsPage] Effect for currentStations triggered. Page: ${page}, Data length: ${currentStations?.length}, isFetching: ${isFetchingStations}, randomFetchKey: ${randomFetchKey}`);
    if (currentStations) {
      setAllLoadedStations((prev) => {
        if (!currentStations || currentStations.length === 0) {
          return prev;
        }
        const newStations = currentStations.filter(
          (newStation) => !prev.some((prevStation) => prevStation.id === newStation.id)
        );
        const combined = [...prev, ...newStations];
        console.log(`[CountryStationsPage] Combined allLoadedStations length: ${combined.length}`);
        
        const finalCombined = combined.slice(Math.max(0, combined.length - MAX_STATIONS_CAP));
        setPlaylist(finalCombined);
        return finalCombined;
      });
    }
  }, [currentStations, page, isFetchingStations, randomFetchKey, setPlaylist]);

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

  const handleLoadMoreStations = useCallback(() => {
    console.log("[CountryStationsPage] Triggered load more stations.");
    if (allLoadedStations.length < MAX_STATIONS_CAP) {
      setRandomFetchKey((prev) => prev + 1);
    } else {
      console.log("[CountryStationsPage] Max stations cap reached.");
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

  const stationListSectionTitle = `All Stations from ${countryName ? shortenCountryName(countryName) : "Unknown Country"}`;

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-background">
      <RadioHeader
        onResetFilters={handleResetFilters}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
      {/* Separator */}
      <div className="w-full h-px bg-border" />
      <FixedControls
        onOpenGenres={() => setIsGenreDialogOpen(true)}
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

        <div className="space-y-6">
          <StationListSection
            title={stationListSectionTitle}
            stations={allLoadedStations}
            isLoading={isFetchingStations}
            onSelectCountry={(country) => navigate(`/country/${encodeURIComponent(country)}`)}
            onSelectGenre={(genreName) => navigate(`/genre/${encodeURIComponent(genreName)}`)}
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
      <NowPlayingNotification
        station={currentStation}
        isVisible={isNowPlayingNotificationVisible}
        onClose={() => setIsNowPlayingNotificationVisible(false)}
      />
      <GenreSelectionDialog
        isOpen={isGenreDialogOpen}
        onClose={() => setIsGenreDialogOpen(false)}
        onSelectCategory={(category) => navigate(`/genre/${encodeURIComponent(category.name)}`)}
        currentSearchQuery={""}
      />
      <CountrySelectionDialog
        isOpen={isCountryDialogOpen}
        onClose={() => setIsCountryDialogOpen(false)}
        onSelectCountry={(country) => {
          navigate(`/country/${encodeURIComponent(country)}`);
          setIsCountryDialogOpen(false);
        }}
        selectedCountry={countryName}
      />
      <ScrollToButtons scrollContainerRef={mainScrollRef} />
      {isPlayerActive && <ScrollToPlayerButton scrollContainerRef={mainScrollRef} playerCardRef={playerCardRef} />}
    </div>
  );
};

export default CountryStationsPage;