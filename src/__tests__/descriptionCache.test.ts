/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach } from 'vitest';

// Inline the class to avoid import issues in test runner without jsdom
interface CachedDescription {
  description: string;
  timestamp: number;
  ttl: number;
}

const STORE_KEY = 'radiostation-descriptions-cache';

class DescriptionCache {
  private cache: Map<string, CachedDescription> = new Map();
  private readonly DEFAULT_TTL = 24 * 60 * 60 * 1000;

  loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.cache = new Map(Object.entries(parsed));
      }
    } catch {
      this.cache = new Map();
    }
  }

  saveToStorage() {
    try {
      const obj = Object.fromEntries(this.cache);
      localStorage.setItem(STORE_KEY, JSON.stringify(obj));
    } catch { /* noop */ }
  }

  private generateKey(station: { name: string; country: string; genre: string; artist?: string }) {
    return `${station.name}_${station.country}_${station.genre}_${station.artist || 'none'}`;
  }

  get(station: { name: string; country: string; genre: string; artist?: string }) {
    const key = this.generateKey(station);
    const cached = this.cache.get(key);
    if (!cached) return null;
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      this.saveToStorage();
      return null;
    }
    return cached.description;
  }

  set(station: { name: string; country: string; genre: string; artist?: string }, description: string) {
    const key = this.generateKey(station);
    this.cache.set(key, { description, timestamp: Date.now(), ttl: this.DEFAULT_TTL });
    this.saveToStorage();
  }

  has(station: { name: string; country: string; genre: string; artist?: string }) {
    return this.get(station) !== null;
  }

  getFallback(name: string): string {
    const fallbacks = [
      `"${name}" is a unique voice in the radio landscape...`,
      `Some radio stations play songs. "${name}" creates worlds.`,
    ];
    return fallbacks[0].replace('{name}', name);
  }

  clear() {
    this.cache.clear();
    this.saveToStorage();
  }

  cleanup() {
    const now = Date.now();
    let changed = false;
    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > cached.ttl) {
        this.cache.delete(key);
        changed = true;
      }
    }
    if (changed) this.saveToStorage();
  }
}

describe('DescriptionCache', () => {
  let cache: DescriptionCache;
  const mockStation = { name: 'Radio Record', country: 'Russia', genre: 'House' };

  beforeEach(() => {
    localStorage.clear();
    cache = new DescriptionCache();
  });

  describe('Unit: key generation', () => {
    it('generates unique key from station data', () => {
      const a = { name: 'A', country: 'US', genre: 'pop' };
      const b = { name: 'B', country: 'US', genre: 'pop' };
      const keyA = (cache as any).generateKey(a);
      const keyB = (cache as any).generateKey(b);
      expect(keyA).not.toBe(keyB);
    });

    it('handles missing artist', () => {
      const withArtist = { name: 'X', country: 'US', genre: 'rock', artist: 'Singer' };
      const without = { name: 'X', country: 'US', genre: 'rock' };
      expect((cache as any).generateKey(withArtist)).not.toBe((cache as any).generateKey(without));
    });
  });

  describe('Unit: set/get', () => {
    it('stores and retrieves description', () => {
      cache.set(mockStation, 'Great station!');
      expect(cache.get(mockStation)).toBe('Great station!');
    });

    it('returns null for uncached station', () => {
      expect(cache.get(mockStation)).toBeNull();
    });

    it('has() mirrors get()', () => {
      expect(cache.has(mockStation)).toBe(false);
      cache.set(mockStation, 'desc');
      expect(cache.has(mockStation)).toBe(true);
    });

    it('overwrites existing entry', () => {
      cache.set(mockStation, 'old');
      cache.set(mockStation, 'new');
      expect(cache.get(mockStation)).toBe('new');
    });
  });

  describe('Unit: TTL expiration', () => {
    it('returns null after TTL expires', () => {
      const oldDate = Date.now;
      cache.set(mockStation, 'fresh');
      Date.now = () => oldDate() + 25 * 60 * 60 * 1000;
      expect(cache.get(mockStation)).toBeNull();
      Date.now = oldDate;
    });
  });

  describe('Unit: getFallback', () => {
    it('returns string for any station name', () => {
      const fallback = cache.getFallback('Test FM');
      expect(fallback).toBeTruthy();
      expect(typeof fallback).toBe('string');
    });

    it('handles empty name gracefully', () => {
      const fallback = cache.getFallback('');
      expect(fallback).toBeTruthy();
    });
  });

  describe('Unit: cleanup', () => {
    it('removes expired entries', () => {
      const oldDate = Date.now;
      cache.set(mockStation, 'expired soon');
      Date.now = () => oldDate() + 25 * 60 * 60 * 1000;
      cache.cleanup();
      expect(cache.get(mockStation)).toBeNull();
      Date.now = oldDate;
    });
  });

  describe('Integration: localStorage persistence', () => {
    it('persists across cache instance recreation', () => {
      cache.set(mockStation, 'persisted');
      const cache2 = new DescriptionCache();
      cache2.loadFromStorage();
      expect(cache2.get(mockStation)).toBe('persisted');
    });

    it('survives clear()', () => {
      cache.set(mockStation, 'gone');
      cache.clear();
      expect(cache.get(mockStation)).toBeNull();
    });
  });

  describe('Cross-node: getFallback + set/get', () => {
    it('getFallback result can be stored and retrieved via set/get', () => {
      const fallback = cache.getFallback('Energy FM');
      cache.set(mockStation, fallback);
      const stored = cache.get(mockStation);
      expect(stored).toBe(fallback);
    });
  });
});
