import React, { useEffect, useState, useRef, useCallback } from "react";
import RadioHeader from "@/components/RadioHeader";
import StationListSection from "@/components/StationListSection";
import NowPlayingNotification from "@/components/NowPlayingNotification";
import SettingsDialog from "@/components/SettingsDialog";
import ScrollToButtons from "@/components/ScrollToButtons";
import { useRadioPlayer } from "@/context/RadioPlayerContext";
import { useAuth } from "@/context/AuthContext";
import { useFavorites, FavoriteStation } from "@/services/favoritesService";
import { Station } from "@/services/radioService";
import { toast } from "sonner";
import { shortenCountryName, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Star, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ScrollToPlayerButton from "@/components/ScrollToPlayerButton";
import FixedControls from "@/components/FixedControls";
import CountrySelectionDialog from "@/components/CountrySelectionDialog";
import GenreSelectionDialog from "@/components/GenreSelectionDialog";
import GoogleIcon from "@/components/GoogleIcon";
import SearchOverlay from "@/components/SearchOverlay";

const NOTIFICATION_SETTING_KEY = "showNowPlayingNotifications";

const FavoritesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getFavorites } = useFavorites();
  const [favorites, setFavorites] = useState<Station[]>([]);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCountryDialogOpen, setIsCountryDialogOpen] = useState(false);
  const [isGenreDialogOpen, setIsGenreDialogOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState<boolean>(() => {
    return localStorage.getItem(NOTIFICATION_SETTING_KEY) ? JSON.parse(localStorage.getItem(NOTIFICATION_SETTING_KEY)!) : true;
  });
  const [isNowPlayingNotificationVisible, setIsNowPlayingNotificationVisible] = useState(false);

  const mainScrollRef = useRef<HTMLElement>(null);
  const playerCardRef = useRef<HTMLDivElement>(null);

  const { isPlaying, currentStation, setPlaylist } = useRadioPlayer();

  const loadFavorites = useCallback(async () => {
    if (!user) {
      setIsLoadingFavorites(false);
      setFavorites([]);
      return;
    }

    setIsLoadingFavorites(true);
    try {
      const favs: FavoriteStation[] = await getFavorites();
      const convertedStations: Station[] = favs.map(fav => ({
        id: fav.station_id,
        name: fav.station_name,
        artist: "",
        genre: fav.station_genre || "Unknown",
        country: fav.station_country || "Unknown",
        imageUrl: fav.station_image_url || "https://picsum.photos/seed/radio/200/200",
        description: fav.station_name,
        streams: [{ bitrate: 128, url: fav.station_stream_url || "" }],
        currentStreamUrl: fav.station_stream_url || "",
        currentBitrate: "128kbps"
      }));
      setFavorites(convertedStations);
      setPlaylist(convertedStations);
    } catch (error) {
      console.error("Error loading favorites:", error);
      toast.error("Failed to load favorites");
      setFavorites([]);
    } finally {
      setIsLoadingFavorites(false);
    }
  }, [user, getFavorites, setPlaylist]);

  useEffect(() => {
    loadFavorites();
  }, [user, loadFavorites]);

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

  const handleToggleNotifications = (checked: boolean) => {
    setShowNotifications(checked);
  };

  const handleResetFilters = () => {
    navigate("/");
  };

  const handleSelectCountry = (countryName: string) => {
    navigate(`/country/${encodeURIComponent(countryName)}`);
  };

  const handleSelectGenre = (genreName: string) => {
    navigate(`/genre/${encodeURIComponent(genreName)}`);
  };

  const handleOpenFavorites = () => {
    navigate("/favorites");
  };

  if (!user) {
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
          onOpenSearch={() => setIsSearchOpen(true)}
        />
        <main className="flex-1 min-h-0 container mx-auto p-4 space-y-8 overflow-y-auto pt-[230px] sm:pt-[190px] pb-[116px]">
          <div className="relative flex flex-col items-center justify-center p-12 mt-16 overflow-hidden rounded-2xl glass-premium group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl" />
            <div className="relative z-10 flex flex-col items-center">
              <div className="p-4 mb-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 ring-1 ring-white/10">
                <User className="h-10 w-10 text-indigo-400" />
              </div>
              <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
                Sign in to see favorites
              </h3>
              <p className="text-muted-foreground/80 text-center max-w-md leading-relaxed">
                Sign in with Google to save and sync your favorite stations across devices.
              </p>
            </div>
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
        <GenreSelectionDialog
          isOpen={isGenreDialogOpen}
          onClose={() => setIsGenreDialogOpen(false)}
          onSelectCategory={(category) => navigate(`/genre/${encodeURIComponent(category.name)}`)}
          currentSearchQuery={""}
        />
        <SearchOverlay
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-background">
      <RadioHeader
        onResetFilters={handleResetFilters}
        onOpenSettings={() => setIsSettingsOpen(true)}
        showGenreSelector={false}
      />
      {/* Separator */}
      <div className="w-full h-px bg-border" />
      <FixedControls
        onOpenGenres={() => setIsGenreDialogOpen(true)}
        onOpenCountries={() => setIsCountryDialogOpen(true)}
        onOpenFavorites={handleOpenFavorites}
        isPlaying={isPlaying}
          onOpenSearch={() => setIsSearchOpen(true)}
      />
      <main ref={mainScrollRef} className="flex-1 min-h-0 container mx-auto p-4 space-y-8 overflow-y-auto pt-[230px] sm:pt-[190px] pb-[116px]">
        <div className="grid grid-cols-1 gap-8 items-start">
          <div className="relative flex flex-col items-center space-y-6 mt-8 p-8 rounded-2xl glass-premium overflow-hidden">
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-indigo-500/8 rounded-full blur-3xl" />
            <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-purple-500/8 rounded-full blur-3xl" />
            <div ref={playerCardRef} className="h-0 w-0" />
            <div className="relative z-10 flex flex-col items-center space-y-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 ring-1 ring-amber-500/20">
                <Star className="h-6 w-6 text-amber-400" />
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 bg-clip-text text-transparent">
                Your Favorite Stations
              </h2>
              <p className="text-muted-foreground/60 text-sm">
                {favorites.length} {favorites.length === 1 ? 'station' : 'stations'} saved
              </p>
              <Button
                variant="outline"
                onClick={loadFavorites}
                disabled={isLoadingFavorites}
                className="glass-card rounded-xl hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-all duration-200"
              >
                <Star className={`h-4 w-4 mr-2 ${isLoadingFavorites ? 'animate-spin' : ''}`} />
                {isLoadingFavorites ? 'Refreshing...' : 'Refresh Favorites'}
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            {isLoadingFavorites ? (
              <StationListSection
                title="Loading Favorites..."
                stations={[]}
                isLoading={true}
              />
            ) : favorites.length > 0 ? (
              <StationListSection
                title="Your Favorites"
                stations={favorites}
                isLoading={false}
                onSelectCountry={handleSelectCountry}
                onSelectGenre={handleSelectGenre}
              />
            ) : (
              <div className="relative flex flex-col items-center justify-center p-10 rounded-2xl glass-premium overflow-hidden group">
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-amber-500/8 rounded-full blur-3xl" />
                <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-pink-500/8 rounded-full blur-3xl" />
                <div className="relative z-10 flex flex-col items-center">
                  <div className="p-4 mb-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 ring-1 ring-amber-500/20">
                    <Star className="h-8 w-8 text-amber-400/80" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground/90">No favorites yet</h3>
                  <p className="text-muted-foreground/70 text-center max-w-sm leading-relaxed">
                    Start playing stations and click the star icon to add them to your favorites.
                  </p>
                </div>
              </div>
            )}
          </div>
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
      <CountrySelectionDialog
        isOpen={isCountryDialogOpen}
        onClose={() => setIsCountryDialogOpen(false)}
        onSelectCountry={handleSelectCountry}
        selectedCountry={undefined}
      />
      <GenreSelectionDialog
        isOpen={isGenreDialogOpen}
        onClose={() => setIsGenreDialogOpen(false)}
        onSelectCategory={(category) => navigate(`/genre/${encodeURIComponent(category.name)}`)}
        currentSearchQuery={""}
      />
      <SearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
      <ScrollToButtons scrollContainerRef={mainScrollRef} />
      <ScrollToPlayerButton scrollContainerRef={mainScrollRef} playerCardRef={playerCardRef} />
    </div>
  );
};

export default FavoritesPage;