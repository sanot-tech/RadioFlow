import React from "react";
import { cn } from "@/lib/utils";

export const GENERIC_IMAGE_URL = "https://picsum.photos/seed/radio/200/200";

/**
 * Cleans a raw station name by removing noise, bitrate info, numbers,
 * collapsing spaces, trimming, and capitalizing each word.
 */
export function cleanStationName(raw: string): string {
  return raw
    // remove bitrate and frequencies (e.g., (0kbps), 128kbps, 87.5 MHz)
    .replace(/\(?\s*\d+([.,]\d+)?\s*(kbps|mhz|Hz)?\s*\)?/gi, "")
    // remove ordinal numbers (#1, No.1 etc.)
    .replace(/\b(no\.?|#)\s*\d+/gi, "")
    // remove all special characters except letters, digits, spaces and ampersands
    .replace(/[^a-zA-Z0-9\s&]+/g, " ")
    // collapse whitespace
    .replace(/\s+/g, " ")
    // trim leading/trailing whitespace
    .trim()
    // capitalize each word
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

interface StationAvatarPlaceholderProps {
  stationName: string;
  className?: string;
}

/**
 * Simple placeholder component for station avatars
 */
export const StationAvatarPlaceholder: React.FC<StationAvatarPlaceholderProps> = ({
  stationName,
  className,
}) => {
  const cleanedName = cleanStationName(stationName);
  
  // Determine font size based on name length to try and fit more
  let fontSizeClass = "text-sm"; // Default for shorter names
  if (cleanedName.length > 15) {
    fontSizeClass = "text-xs";
  }
  if (cleanedName.length > 25) {
    fontSizeClass = "text-[10px]"; // Even smaller, custom size
  }
  // For very long names, we might need to go even smaller or rely on overflow ellipsis
  if (cleanedName.length > 35) {
    fontSizeClass = "text-[8px]";
  }

  return (
    <div className={cn("relative flex items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-blue-500 to-purple-600", className)}>
      <span className={cn(
        "text-white font-bold text-center break-words leading-tight drop-shadow-md px-1", // Added px-1 for minimal horizontal padding
        fontSizeClass
      )}>
        {cleanedName} {/* Display full cleaned name */}
      </span>
    </div>
  );
};