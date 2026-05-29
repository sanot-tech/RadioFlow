// Hooks for working with trends
// src/hooks/useTrends.ts

import { useState, useEffect } from 'react';
import { trendsService } from '@/services/trendsService';
import { Station } from '@/services/radioService';
import { diverseTrendGenerator, MatchedStation } from '@/services/diverseTrendGenerator';

export const useTrends = () => {
  const [trends, setTrends] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        setLoading(true);
        const data = await trendsService.getTrends();
        setTrends(data);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching trends:', err);
        setError(err.message || 'Failed to fetch trends');
      } finally {
        setLoading(false);
      }
    };

    fetchTrends();
  }, []);

  return { trends, loading, error };
};

export const useTopStations = (stations: Station[]) => {
  const { trends, loading, error } = useTrends();
  const [topStations, setTopStations] = useState<MatchedStation[]>([]);

  useEffect(() => {
    if (trends && stations.length > 0) {
      try {
        const top = diverseTrendGenerator.getTopStations(trends, stations, 50); // Request 50 stations
        setTopStations(top);
      } catch (err) {
        console.error('Error generating diverse trends for stations:', err);
      }
    } else if (stations.length > 0 && trends) {
      // If trends are loaded but stations are not, still try to get results
      try {
        const top = diverseTrendGenerator.getTopStations(trends, stations, 50);
        setTopStations(top);
      } catch (err) {
        console.error('Error generating diverse trends for stations:', err);
      }
    }
  }, [trends, stations]);

  return { topStations, loading, error };
};

export const useTrendingStations = (stations: Station[]) => {
  const { trends, loading, error } = useTrends();
  const [trendingStations, setTrendingStations] = useState<MatchedStation[]>([]);

  useEffect(() => {
    if (trends && stations.length > 0) {
      try {
        const trending = diverseTrendGenerator.getTrendingStations(trends, stations, 50); // Request 50 stations
        setTrendingStations(trending);
      } catch (err) {
        console.error('Error generating diverse trends for stations:', err);
      }
    } else if (stations.length > 0 && trends) {
      // If trends are loaded but stations are not, still try to get results
      try {
        const trending = diverseTrendGenerator.getTrendingStations(trends, stations, 50);
        setTrendingStations(trending);
      } catch (err) {
        console.error('Error generating diverse trends for stations:', err);
      }
    }
  }, [trends, stations]);

  return { trendingStations, loading, error };
};