import React from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Loader2 } from "lucide-react"; // Removed Volume2, VolumeX
import { useRadioPlayer } from "@/context/RadioPlayerContext";
import { toast } from "sonner"; // Keep toast for potential messages

const PlayerControls: React.FC = () => {
  const {
    isPlaying,
    togglePlayPause,
    isLoading,
    loadingStationId,
    currentStation,
  } = useRadioPlayer();

  // Removed handleVolumeChange and toggleMute as volume controls are moved

  return (
    <div className="flex flex-col items-center gap-4 p-4 bg-card rounded-lg shadow-lg">
      {/* Play/Pause Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={togglePlayPause}
        disabled={false} // Don't disable when loading - user should be able to pause
        className="h-12 w-12"
      >
        {loadingStationId === currentStation?.id ? (
          <Loader2 className="h-8 w-8 animate-spin" />
        ) : isPlaying ? (
          <Pause className="h-8 w-8" />
        ) : (
          <Play className="h-8 w-8" />
        )}
        <span className="sr-only">
          {loadingStationId === currentStation?.id ? "Loading" : isPlaying ? "Pause" : "Play"}
        </span>
      </Button>

      {/* Removed Volume Controls from here */}
    </div>
  );
};

export default PlayerControls;