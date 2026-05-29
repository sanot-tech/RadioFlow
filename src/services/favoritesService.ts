import { Station } from "./radioService";
import { useCallback } from "react";

export interface FavoriteStation {
  id: string;
  station_id: string;
  station_name: string;
  station_image_url?: string;
  station_genre?: string;
  station_country?: string;
  station_stream_url?: string;
  created_at: string;
}

export const useFavorites = () => {
  const addToFavorites = useCallback(async (_station: Station) => {
    // Auth disabled — favorites not supported
  }, []);

  const removeFromFavorites = useCallback(async (_stationId: string) => {
    // Auth disabled — favorites not supported
  }, []);

  const getFavorites = useCallback(async (): Promise<any[]> => {
    return [];
  }, []);

  const isStationFavorite = useCallback(async (_stationId: string): Promise<boolean> => {
    return false;
  }, []);

  return {
    addToFavorites,
    removeFromFavorites,
    getFavorites,
    isStationFavorite
  };
};