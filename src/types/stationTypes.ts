// Station interface extension for trend matching support
// src/types/stationTypes.ts

import { Station as BaseStation } from '@/services/radioService';
import { TrendingTrack } from '@/services/trendsService';

export interface TrendingStation extends BaseStation {
  matchScore?: number;
  matchedKeywords?: string[];
  matchedTracks?: TrendingTrack[];
}