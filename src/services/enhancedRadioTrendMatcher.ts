// Enhanced service for matching trends to radio stations
// src/services/enhancedRadioTrendMatcher.ts

import { Station } from './radioService';
import { TrendingData, TrendingTrack } from './trendsService';

interface MatchedStation extends Station {
  matchScore: number;
  matchedKeywords: string[];
  matchedTracks: TrendingTrack[];
}


class EnhancedRadioTrendMatcher {
  /**
   * Matches trending data to radio stations
   */
  matchTrendsToStations(trends: TrendingData, stations: Station[]): MatchedStation[] {
    return stations.map(station => {
      // Calculate match score for each station
      const { score, keywords, matchedTracks } = this.calculateMatchScore(station, trends);

      return {
        ...station,
        matchScore: score,
        matchedKeywords: keywords,
        matchedTracks: matchedTracks
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore); // Sort by match score
  }

  /**
   * Calculates match score between station and trends
   */
  private calculateMatchScore(station: Station, trends: TrendingData): { 
    score: number; 
    keywords: string[]; 
    matchedTracks: TrendingTrack[] 
  } {
    let score = 0;
    const matchedKeywords: string[] = [];
    const matchedTracks: TrendingTrack[] = [];

    // Add base score for all stations to avoid zeros
    const baseScore = 20; // Increase base score for more variety
    score += baseScore;

    // Check genre match
    const genreMatches = this.matchGenre(station.genre, trends);
    score += genreMatches.score;
    matchedKeywords.push(...genreMatches.keywords);

    // Check keyword match
    const keywordMatches = this.matchKeywords(station, trends);
    score += keywordMatches.score;
    matchedKeywords.push(...keywordMatches.keywords);
    matchedTracks.push(...keywordMatches.tracks);

    // Check mood/atmosphere match
    const moodMatches = this.matchMood(station, trends);
    score += moodMatches.score;
    matchedKeywords.push(...moodMatches.keywords);

    // Add bonus for number of matches
    if (matchedTracks.length > 0) {
      // Increase bonus for each matched track
      score += matchedTracks.length * 3;
    }

    // Normalize score (0-100)
    const normalizedScore = Math.min(score, 100);

    return { 
      score: normalizedScore, 
      keywords: [...new Set(matchedKeywords)], 
      matchedTracks: [...new Set(matchedTracks)] 
    };
  }

  /**
   * Matches station genre with trending genres
   */
  private matchGenre(stationGenre: string, trends: TrendingData): { score: number; keywords: string[] } {
    let score = 0;
    const keywords: string[] = [];

    // Normalize genre for comparison
    const normalizedGenre = stationGenre.toLowerCase();

    // Check exact genre match
    if (trends.genres.some(genre => 
      genre.toLowerCase() === normalizedGenre || 
      normalizedGenre.includes(genre.toLowerCase()) ||
      genre.toLowerCase().includes(normalizedGenre)
    )) {
      score += 30; // High score for genre match
      keywords.push(normalizedGenre);
    }

    // Check partial match with wider range
    trends.genres.forEach(trendGenre => {
      const lowerTrendGenre = trendGenre.toLowerCase();
      
      // Substring match
      if (normalizedGenre.includes(lowerTrendGenre) || lowerTrendGenre.includes(normalizedGenre)) {
        score += 20;
        keywords.push(trendGenre);
      }
      // First 3-4 letter match
      else if (normalizedGenre.substring(0, 4) === lowerTrendGenre.substring(0, 4) ||
               normalizedGenre.substring(0, 3) === lowerTrendGenre.substring(0, 3)) {
        score += 10;
        keywords.push(trendGenre);
      }
      // Common category match
      else if ((normalizedGenre.includes('pop') && lowerTrendGenre.includes('pop')) ||
               (normalizedGenre.includes('rock') && lowerTrendGenre.includes('rock')) ||
               (normalizedGenre.includes('hip') && lowerTrendGenre.includes('hip')) ||
               (normalizedGenre.includes('rnb') && lowerTrendGenre.includes('rnb')) ||
               (normalizedGenre.includes('electronic') && lowerTrendGenre.includes('electronic')) ||
               (normalizedGenre.includes('dance') && lowerTrendGenre.includes('dance'))) {
        score += 15;
        keywords.push(trendGenre);
      }
      // Broader category match
      else if ((normalizedGenre.includes('pop') || normalizedGenre.includes('top')) &&
               (lowerTrendGenre.includes('pop') || lowerTrendGenre.includes('chart'))) {
        score += 10;
        keywords.push(trendGenre);
      }
      else if ((normalizedGenre.includes('urban') || normalizedGenre.includes('city')) &&
               (lowerTrendGenre.includes('hip') || lowerTrendGenre.includes('rnb') || lowerTrendGenre.includes('urban'))) {
        score += 10;
        keywords.push(trendGenre);
      }
    });

    return { score, keywords };
  }

  /**
   * Matches station keywords with trending data
   */
  private matchKeywords(station: Station, trends: TrendingData): { 
    score: number; 
    keywords: string[]; 
    tracks: TrendingTrack[] 
  } {
    let score = 0;
    const keywords: string[] = [];
    const tracks: TrendingTrack[] = [];

    // Build list of potential keywords for the station
    const stationKeywords = [
      station.name.toLowerCase(),
      station.genre.toLowerCase(),
      station.country.toLowerCase(),
      ...(station.description ? [station.description.toLowerCase()] : [])
    ].join(' ');

    // Check match with trending tracks
    trends.tracks.forEach(track => {
      let trackMatchScore = 0;
      const trackKeywords: string[] = [];

    // Check genre match
      if (track.genre.toLowerCase() === station.genre.toLowerCase()) {
        trackMatchScore += 15;
        trackKeywords.push(track.genre);
      }

      // Check partial genre match
      if (station.genre.toLowerCase().includes(track.genre.toLowerCase()) || 
          track.genre.toLowerCase().includes(station.genre.toLowerCase())) {
        trackMatchScore += 10;
        trackKeywords.push(track.genre);
      }

      // Check match with track keywords
      track.keywords.forEach(keyword => {
        if (stationKeywords.includes(keyword.toLowerCase())) {
          trackMatchScore += 5;
          trackKeywords.push(keyword);
        }
        // Check partial keyword match
        else if (keyword.length > 3 && stationKeywords.includes(keyword.toLowerCase().substring(0, Math.min(4, keyword.length)))) {
          trackMatchScore += 2;
          trackKeywords.push(keyword);
        }
      });

      // Check match by track title or artist name
      if (stationKeywords.includes(track.title.toLowerCase()) || 
          stationKeywords.includes(track.artist.toLowerCase())) {
        trackMatchScore += 12;
        trackKeywords.push(track.title, track.artist);
      }
      // Check partial match by track title or artist name
      else if (track.title.toLowerCase().length > 3 && 
               stationKeywords.includes(track.title.toLowerCase().substring(0, Math.min(4, track.title.toLowerCase().length)))) {
        trackMatchScore += 6;
        trackKeywords.push(track.title);
      }
      else if (track.artist.toLowerCase().length > 3 && 
               stationKeywords.includes(track.artist.toLowerCase().substring(0, Math.min(4, track.artist.toLowerCase().length)))) {
        trackMatchScore += 6;
        trackKeywords.push(track.artist);
      }

      // Check popularity match
      if (track.popularity > 85) {
        // Bonus for very popular tracks
        trackMatchScore += 2;
      } else if (track.popularity > 70) {
        trackMatchScore += 1;
      }

      // If there's any match, add the track
      if (trackMatchScore > 0) {
        score += trackMatchScore;
        keywords.push(...trackKeywords);
        if (!tracks.includes(track)) {
          tracks.push(track);
        }
      }
    });

    // Check match with general trending keywords
    trends.moods.forEach(mood => {
      if (stationKeywords.includes(mood.toLowerCase())) {
        score += 8;
        keywords.push(mood);
      }
      // Check partial mood match
      else if (mood.length > 4 && stationKeywords.includes(mood.substring(0, Math.floor(mood.length * 0.7)))) {
        score += 4;
        keywords.push(mood);
      }
      // Check first letter match
      else if (mood.length > 3 && stationKeywords.split(/\s+/).some(word => 
        word.length > 3 && mood.substring(0, Math.min(4, mood.length)).toLowerCase() === 
        word.substring(0, Math.min(4, word.length)).toLowerCase())) {
        score += 2;
        keywords.push(mood);
      }
    });

    return { score, keywords, tracks };
  }

  /**
   * Matches station mood/atmosphere with trends
   */
  private matchMood(station: Station, trends: TrendingData): { score: number; keywords: string[] } {
    let score = 0;
    const keywords: string[] = [];

    // Determine station mood based on its description and genre
    const stationMood = this.extractMood(station).toLowerCase();

    // Compare with trending moods
    trends.moods.forEach(trendMood => {
      const lowerTrendMood = trendMood.toLowerCase();
      
      // Exact match
      if (stationMood.includes(lowerTrendMood)) {
        score += 12;
        keywords.push(trendMood);
      }
      // Partial match
      else if (lowerTrendMood.length > 4 && stationMood.includes(lowerTrendMood.substring(0, Math.floor(lowerTrendMood.length * 0.7)))) {
        score += 6;
        keywords.push(trendMood);
      }
      // Common category match
      else if ((stationMood.includes('happy') && lowerTrendMood.includes('upbeat')) ||
               (stationMood.includes('sad') && lowerTrendMood.includes('melancholic')) ||
               (stationMood.includes('love') && lowerTrendMood.includes('romantic')) ||
               (stationMood.includes('energy') && lowerTrendMood.includes('energetic')) ||
               (stationMood.includes('chill') && lowerTrendMood.includes('chill')) ||
               (stationMood.includes('party') && lowerTrendMood.includes('party'))) {
        score += 8;
        keywords.push(trendMood);
      }
    });

    return { score, keywords };
  }

  /**
   * Extracts mood/atmosphere from station data
   */
  private extractMood(station: Station): string {
    // Determine mood based on genre and other characteristics
    const moodIndicators = [
      station.genre.toLowerCase(),
      station.name.toLowerCase(),
      station.country.toLowerCase(), // Country can influence mood
      ...(station.description ? [station.description.toLowerCase()] : [])
    ].join(' ');

    return moodIndicators;
  }

  /**
   * Gets top stations based on trends
   */
  getTopStations(trends: TrendingData, stations: Station[], count: number = 50): MatchedStation[] {
    // Match all stations with trends
    const allMatchedStations = stations.map(station => {
      const { score, keywords, matchedTracks } = this.calculateMatchScore(station, trends);
      
      return {
        ...station,
        matchScore: score,
        matchedKeywords: keywords,
        matchedTracks: matchedTracks
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore); // Sort by match score

    // Return requested number of stations, or all if fewer
    return allMatchedStations.slice(0, Math.min(count, allMatchedStations.length));
  }

  /**
   * Gets trending stations based on recent changes
   */
  getTrendingStations(trends: TrendingData, stations: Station[], count: number = 50): MatchedStation[] {
    // For trending stations we use the same logic as for top stations
    // But we can add additional logic to highlight "trending" stations
    
    // Return all stations sorted by trend match
    return this.getTopStations(trends, stations, count);
  }
}

export const enhancedRadioTrendMatcher = new EnhancedRadioTrendMatcher();
export type { MatchedStation };