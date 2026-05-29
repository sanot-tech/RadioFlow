import React, { useState, useEffect } from "react";
import StationCard from "./StationCard";
import { FavoriteStation } from "@/services/favoritesService";
import { useFavorites } from "@/services/favoritesService";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Star, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import GoogleIcon from "./GoogleIcon";

interface FavoritesSectionProps {
  onSelectCountry?: (countryName: string) => void;
  onSelectGenre?: (genreName: string) => void;
}

const FavoritesSection: React.FC<FavoritesSectionProps> = ({
  onSelectCountry,
  onSelectGenre,
}) => {
  const [favorites, setFavorites] = useState<FavoriteStation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const { getFavorites } = useFavorites();
  const { user } = useAuth();

  useEffect(() => {
    loadFavorites();
  }, [user]);

  const loadFavorites = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const favs = await getFavorites();
      setFavorites(favs);
    } catch (error) {
      console.error("Error loading favorites:", error);
      toast.error("Failed to load favorites");
    } finally {
      setIsLoading(false);
    }
  };

  const convertToStation = (fav: FavoriteStation) => ({
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
  });

  if (!user) {
    return (
      <section className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Favorites</h2>
        </div>
        <div className="flex flex-col items-center justify-center p-8 bg-card rounded-lg border-2 border-dashed border-muted">
          <Star className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Sign in to save favorites</h3>
          <p className="text-muted-foreground text-center mb-4">
            Log in with your Google account to save your favorite stations and access them from any device.
          </p>
          <Button disabled className="gap-2 opacity-40 cursor-default">
            <GoogleIcon className="h-4 w-4" />
            Sign in with Google
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Favorites</h2>
        <Button variant="outline" size="sm" onClick={loadFavorites}>
          Refresh
        </Button>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-4 p-4 bg-card rounded-lg">
              <Skeleton className="h-16 w-16 rounded-lg" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : favorites.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {favorites.map((fav) => (
            <StationCard
              key={fav.id}
              station={convertToStation(fav)}
              onSelectCountry={onSelectCountry}
              onSelectGenre={onSelectGenre}
              showLoginPrompt={showLoginPrompt}
              setShowLoginPrompt={setShowLoginPrompt}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-8 bg-card rounded-lg border-2 border-dashed border-muted">
          <Star className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No favorites yet</h3>
          <p className="text-muted-foreground text-center">
            Start playing stations and click the star icon to add them to your favorites.
          </p>
        </div>
      )}
    </section>
  );
};

export default FavoritesSection;