"use client";

import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn, cleanStationName } from "@/lib/utils"; // Import cleanStationName from utils
import { Station } from "@/services/radioService";
import { Button } from "@/components/ui/button";
import StationImagePlaceholder from "./StationImagePlaceholder"; // Use the new placeholder

interface NowPlayingNotificationProps {
  station: Station | null;
  isVisible: boolean;
  onClose: () => void;
}

const NowPlayingNotification: React.FC<NowPlayingNotificationProps> = ({
  station,
  isVisible,
  onClose,
}) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isVisible && station) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        onClose();
      }, 5000); // Auto-dismiss after 5 seconds
      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [isVisible, station, onClose]);

  if (!station || !show) {
    return null;
  }

  const GENERIC_IMAGE_URL = "https://picsum.photos/seed/radio/200/200"; // Define here or import if needed
  const usePlaceholder = !station.imageUrl || station.imageUrl.includes("picsum.photos") || station.imageUrl === GENERIC_IMAGE_URL;
  const cleanedStationName = cleanStationName(station.name);

  return (
    <div
      className={cn(
        "fixed top-4 right-4 z-50 w-full max-w-xs bg-card border border-border rounded-lg shadow-lg p-3 flex items-center space-x-3 transition-all duration-300 ease-in-out",
        show ? "translate-x-0 opacity-100" : "translate-x-full opacity-0",
      )}
    >
      <div className="flex-shrink-0 w-12 h-12">
        {usePlaceholder ? (
          <StationImagePlaceholder
            stationName={cleanedStationName}
            className="w-full h-full"
          />
        ) : (
          <img
            src={station.imageUrl}
            alt={cleanedStationName}
            className="w-full h-full rounded-md object-cover"
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{cleanedStationName}</p>
        <p className="text-xs text-muted-foreground truncate">
          {station.artist || station.genre}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="flex-shrink-0 h-6 w-6 text-muted-foreground hover:text-foreground"
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Close notification</span>
      </Button>
    </div>
  );
};

export default NowPlayingNotification;