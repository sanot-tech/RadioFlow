// Service for fetching trends from external sources
// src/services/trendsService.ts

import { realTrendParserService } from './realTrendParserService';
import { ParsedTrends } from './realTrendParserService';

interface TrendingTrack {
  title: string;
  artist: string;
  genre: string;
  platform: string;
  popularity: number; // 0-100
  keywords: string[];
}

interface TrendingData {
  tracks: TrendingTrack[];
  genres: string[];
  moods: string[];
  timestamps: {
    youtube: Date;
    appleMusic: Date;
    spotify: Date;
  };
}

class TrendsService {
  private static instance: TrendsService;
  private trendsData: TrendingData | null = null;
  private lastUpdate: Date | null = null;

  private constructor() {}

  public static getInstance(): TrendsService {
    if (!TrendsService.instance) {
      TrendsService.instance = new TrendsService();
    }
    return TrendsService.instance;
  }

  /**
   * Fetches trending data from external sources
   * Uses real parser to extract data from music platforms
   */
  async fetchTrends(): Promise<TrendingData> {
    console.log("[TrendsService] Fetching trends from real music platforms...");

    // Use real parser to get data
    const parsedData = await realTrendParserService.getTrends();

    // Transform data from parser format to trends service format
    const trendingData: TrendingData = {
      tracks: parsedData.tracks.map(track => ({
        title: track.title,
        artist: track.artist,
        genre: track.genre,
        platform: track.platform,
        popularity: track.popularity,
        keywords: track.keywords
      })),
      genres: parsedData.genres,
      moods: parsedData.moods,
      timestamps: {
        youtube: new Date(Date.now() - Math.floor(Math.random() * 3600000)), // Random time for each source
        appleMusic: new Date(Date.now() - Math.floor(Math.random() * 3600000)),
        spotify: new Date(Date.now() - Math.floor(Math.random() * 3600000))
      }
    };

    this.trendsData = trendingData;
    this.lastUpdate = new Date();

    return this.trendsData;
  }

  /**
   * Returns the latest fetched trending data
   */
  getLatestTrends(): TrendingData | null {
    return this.trendsData;
  }

  /**
   * Checks if data needs to be updated
   */
  needsUpdate(): boolean {
    if (!this.lastUpdate) return true;

    // Update data every 30 minutes
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    return this.lastUpdate < thirtyMinutesAgo;
  }

  /**
   * Gets trending data with caching
   */
  async getTrends(): Promise<TrendingData> {
    if (this.needsUpdate()) {
      return await this.fetchTrends();
    }
    return this.trendsData!;
  }
}

export const trendsService = TrendsService.getInstance();
export type { TrendingTrack, TrendingData };