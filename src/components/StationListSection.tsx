import React, { useState } from "react";
import StationCard from "./StationCard";
import { Station } from "@/services/radioService";
import { TrendingStation } from "@/types/stationTypes";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Globe, WifiOff, RotateCcw } from "lucide-react";
import StationCardSkeleton from "./StationCardSkeleton";
import { cn } from "@/lib/utils";

interface StationListSectionProps {
  title: string;
  stations: (Station | TrendingStation)[] | undefined;
  isLoading: boolean;
  onSelectCountry?: (countryName: string) => void;
  selectedCountry?: string;
  onClearCountryFilter?: () => void;
  onBrowseCountries?: () => void;
  onSelectGenre?: (genreName: string) => void;
  className?: string;
}

const StationListSection: React.FC<StationListSectionProps> = ({
  title,
  stations,
  isLoading,
  onSelectCountry,
  selectedCountry,
  onClearCountryFilter,
  onBrowseCountries,
  onSelectGenre,
  className,
}) => {
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const showTitleCentered = !isLoading && (stations === undefined || stations.length === 0);
  
  // Check if we have stations but they're mock data (indicated by a specific property)
  const hasMockData = stations && stations.length > 0 && stations.some(station => 
    station.imageUrl.includes('picsum.photos') && station.streams[0]?.url.includes('example.com')
  );

  return (
    <section className={cn("py-6 px-4 space-y-8", className)}>
      <div className="flex flex-col items-center justify-center text-center my-6 first:mt-0">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary via-purple-600 to-violet-600 bg-clip-text text-transparent">
          {title}
        </h2>
        <div className="w-24 h-1 bg-gradient-to-r from-primary via-purple-600 to-violet-600 rounded-full mx-auto mt-3 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
        </div>
        
        {hasMockData && (
          <div className="mt-3 flex items-center gap-2 text-yellow-600 dark:text-yellow-400 text-sm">
            <WifiOff size={16} />
            <span>Using fallback data - API temporarily unavailable</span>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading && (stations === undefined || stations.length === 0)
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex justify-center w-full">
                <StationCardSkeleton />
              </div>
            ))
          : stations && stations.length > 0 ? (
            stations.map((station, index) => (
              <div key={station.id} className="flex justify-center w-full" style={{ contain: 'layout style' }}>
                <div className="w-full max-w-[300px]">
                  <StationCard
                    station={station}
                    onSelectCountry={onSelectCountry}
                    onSelectGenre={onSelectGenre}
                    showLoginPrompt={showLoginPrompt}
                    setShowLoginPrompt={setShowLoginPrompt}
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <div className="flex flex-col items-center justify-center gap-4">
                <WifiOff className="text-muted-foreground" size={48} />
                <p className="text-muted-foreground text-lg">No stations found.</p>
                <p className="text-muted-foreground text-sm max-w-md">
                  {selectedCountry 
                    ? `No stations available for ${selectedCountry}. Try selecting a different country.`
                    : "Try adjusting your search or filter criteria."}
                </p>
                {(onClearCountryFilter || onBrowseCountries) && (
                  <div className="flex gap-2 mt-2">
                    {onClearCountryFilter && (
                      <Button onClick={onClearCountryFilter} variant="outline">
                        Clear Filter
                      </Button>
                    )}
                    {onBrowseCountries && (
                      <Button onClick={onBrowseCountries} variant="outline">
                        Browse Countries
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
      </div>
    </section>
  );
};

export default React.memo(StationListSection);