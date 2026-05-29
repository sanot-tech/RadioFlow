// Radio station description caching service
// Prevents repeated API calls when switching between stations

interface CachedDescription {
  description: string;
  timestamp: number; // Cache creation time in milliseconds
  ttl: number; // Cache time-to-live in milliseconds (e.g., 24 hours = 86400000 ms)
}

class DescriptionCache {
  private cache: Map<string, CachedDescription> = new Map();

  // Cache TTL - 24 hours (in milliseconds)
  private readonly DEFAULT_TTL = 24 * 60 * 60 * 1000;
  private readonly CACHE_KEY = 'radiostation-descriptions-cache';

  constructor() {
    this.loadFromStorage();
    // Start cleanup of expired entries on initialization
    this.cleanup();
  }

  /**
   * Generates a unique cache key based on station data
   */
  private generateKey(station: {
    name: string;
    country: string;
    genre: string;
    artist?: string;
    description?: string;
  }): string {
    return `${station.name}_${station.country}_${station.genre}_${station.artist || 'none'}`;
  }

  /**
   * Loads cache from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.CACHE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Restore Map from object
        this.cache = new Map(Object.entries(parsed));
      }
    } catch (error) {
      console.warn('Failed to load cache from storage:', error);
      // If loading failed, start with empty cache
      this.cache = new Map();
    }
  }

  /**
   * Saves cache to localStorage
   */
  private saveToStorage(): void {
    try {
      // Convert Map to object for localStorage storage
      const obj = Object.fromEntries(this.cache);
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(obj));
    } catch (error) {
      console.warn('Failed to save cache to storage:', error);
    }
  }

  /**
   * Gets cached description if it exists and hasn't expired
   */
  get(station: {
    name: string;
    country: string;
    genre: string;
    artist?: string;
    description?: string;
  }): string | null {
    const key = this.generateKey(station);
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    // Check if cache TTL has expired
    const now = Date.now();
    if (now - cached.timestamp > cached.ttl) {
      // Delete expired cache
      this.cache.delete(key);
      this.saveToStorage(); // Save updated cache
      return null;
    }

    return cached.description;
  }

  /**
   * Saves description to cache
   */
  set(
    station: {
      name: string;
      country: string;
      genre: string;
      artist?: string;
      description?: string;
    },
    description: string
  ): void {
    const key = this.generateKey(station);
    const cached: CachedDescription = {
      description,
      timestamp: Date.now(),
      ttl: this.DEFAULT_TTL
    };

    this.cache.set(key, cached);
    this.saveToStorage(); // Save updated cache
  }

  /**
   * Checks if there's a cached description for the station
   */
  has(station: {
    name: string;
    country: string;
    genre: string;
    artist?: string;
    description?: string;
  }): boolean {
    return this.get(station) !== null;
  }

  /**
   * Returns a locally-generated fallback description
   * Used when API is unavailable (402, timeout, etc)
   */
  getFallback(name: string): string | null {
    const cleanName = name.replace(/[^a-zA-Z0-9\s\u0400-\u04FF]/g, '').trim() || 'This station';
    const fallbacks = [
      `"${cleanName}" is a unique voice in the radio landscape, offering a carefully curated selection that reflects its distinctive character. Every broadcast is crafted to create a specific atmosphere, drawing listeners into a world of sound that feels both familiar and fresh. The programming flows with intention, taking you on a journey through different moods and moments. Whether it's the energy of the morning, the calm of the afternoon, or the introspection of late night, ${cleanName} provides the perfect companion. It's more than just a radio station — it's an experience, a mood, a constant presence that enriches the everyday.`,
      `"${cleanName}" — where every listen feels like a discovery. The station's programming is built around a simple idea: that great music and thoughtful curation can transform any moment. From the first note to the last, ${cleanName} creates a sonic environment that invites you to stay, to explore, to lose yourself in the sound. It's the kind of station that becomes a part of your daily ritual, a trusted friend that always knows what to play. Tune in, turn up, and let ${cleanName} be the soundtrack to your story.`,
      `Some radio stations play songs. "${cleanName}" creates worlds. Each track is carefully chosen to build a narrative that unfolds throughout the day, creating a rich tapestry of sound that evolves and adapts. It's the perfect balance of familiar favorites and unexpected gems, all woven together with a seamless flow that keeps you engaged from start to finish. Whether you're working, relaxing, or on the move, ${cleanName} provides the ideal backdrop — a constant source of inspiration and energy that makes every moment better.`,
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }

  /**
   * Clears the entire cache
   */
  clear(): void {
    this.cache.clear();
    this.saveToStorage(); // Save empty cache
  }

  /**
   * Removes entries starting with "ERROR:" (stale API errors after model change)
   */
  clearErrors(): void {
    let changed = false;
    for (const [key, cached] of this.cache.entries()) {
      if (cached.description.startsWith('ERROR:')) {
        this.cache.delete(key);
        changed = true;
      }
    }
    if (changed) {
      this.saveToStorage();
    }
  }

  /**
   * Clears expired entries from cache
   */
  cleanup(): void {
    const now = Date.now();
    let changed = false;

    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > cached.ttl) {
        this.cache.delete(key);
        changed = true;
      }
    }

    if (changed) {
      this.saveToStorage(); // Save updated cache
    }
  }
}

// Create global cache instance
export const descriptionCache = new DescriptionCache();

// Export types for use in other modules
export type { CachedDescription };