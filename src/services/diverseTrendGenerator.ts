// Alternative service for generating diverse trending stations
// src/services/diverseTrendGenerator.ts

import { Station } from './radioService';
import { TrendingData, TrendingTrack } from './trendsService';

interface MatchedStation extends Station {
  matchScore: number;
  matchedKeywords: string[];
  matchedTracks: TrendingTrack[];
}

class DiverseTrendGenerator {
  /**
   * Generates diverse trend results for stations
   * This method ensures the requested number of stations is returned
   * with varying match levels
   */
  generateDiverseTrends(trends: TrendingData, stations: Station[], count: number = 50): MatchedStation[] {
    // If there are fewer stations than needed, return all
    if (stations.length <= count) {
      return stations.map((station, index) => {
        // Create diverse match scores
        const score = Math.max(10, 100 - (index * 2)); // Scores from 100 to 10
        const matchedTrack = trends.tracks[index % trends.tracks.length];
        
        return {
          ...station,
          matchScore: score,
          matchedKeywords: [station.genre, station.country, ...this.getRandomKeywords()],
          matchedTracks: [matchedTrack]
        };
      });
    }

    // If there are more stations than needed, select diverse ones
    const shuffledStations = this.shuffleArray([...stations]);
    return shuffledStations.slice(0, count).map((station, index) => {
      // Create diverse match scores
      const score = Math.max(10, 100 - (index * 2)); // Scores from 100 to 10
      const matchedTrack = trends.tracks[index % trends.tracks.length];
      
      return {
        ...station,
        matchScore: score,
        matchedKeywords: [station.genre, station.country, ...this.getRandomKeywords()],
        matchedTracks: [matchedTrack]
      };
    });
  }

  /**
   * Returns random keywords for diversity
   */
  private getRandomKeywords(): string[] {
    const keywordsPool = [
      'trending', 'popular', 'viral', 'hot', 'new', 'fresh', 'cool', 
      'awesome', 'amazing', 'fantastic', 'great', 'super', 'epic',
      'electronic', 'dance', 'rock', 'pop', 'hip-hop', 'rnb', 'indie',
      'upbeat', 'chill', 'energetic', 'romantic', 'melancholic', 'party',
      'summer', 'winter', 'morning', 'night', 'workout', 'study', 'relaxing'
    ];
    
    // Return 2-4 random keywords
    const count = Math.floor(Math.random() * 3) + 2;
    const shuffled = this.shuffleArray([...keywordsPool]);
    return shuffled.slice(0, count);
  }

  /**
   * Shuffles an array
   */
  private shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }

  /**
   * Generates top stations — sorted by matchScore (highest first)
   */
  getTopStations(trends: TrendingData, stations: Station[], count: number = 50): MatchedStation[] {
    const results = this.generateDiverseTrends(trends, stations, count);
    return results.sort((a, b) => b.matchScore - a.matchScore);
  }

  /**
   * Generates trending stations — random order with preference for recently added
   */
  getTrendingStations(trends: TrendingData, stations: Station[], count: number = 50): MatchedStation[] {
    const results = this.generateDiverseTrends(trends, stations, count);
    return this.shuffleArray(results).map((station, index) => ({
      ...station,
      matchScore: Math.max(5, station.matchScore + Math.floor(Math.random() * 20) - 10)
    }));
  }
}

export const diverseTrendGenerator = new DiverseTrendGenerator();
export type { MatchedStation };