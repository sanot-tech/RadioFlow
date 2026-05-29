import React, { useMemo } from 'react';
import StationsPage from "./StationsPage";
import { useStations } from "@/services/radioService";

const TREND_SETS = [
  ['viral', 'trending', 'hot'],
  ['pop', 'dance', 'party'],
  ['new', 'fresh', 'discover'],
  ['remix', 'cover', 'live'],
  ['summer', 'festival', 'club'],
  ['mood', 'chill', 'focus'],
  ['retro', 'classic', 'golden'],
  ['underground', 'independent', 'emerging'],
];

const TrendingStationsPage: React.FC = () => {
  const seed = useMemo(() => Date.now(), []);
  const queries = TREND_SETS.map((genres, i) =>
    useStations(undefined, genres, 0, 150, 'random', undefined, undefined, 'default', true, seed + i * 7)
  );

  const allData = queries.map(q => q.data || []).flat();
  const anyData = allData.length > 0;
  const allDone = queries.every(q => !q.isLoading);

  const stations = useMemo(() => {
    if (allData.length === 0) return [];
    const seen = new Set<string>();
    const unique = allData.filter(s => {
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });
    return unique.sort(() => Math.random() - 0.5).slice(0, 500);
  }, [allData.length]);

  const error = useMemo(() => {
    if (allDone && allData.length === 0) {
      const errors = queries.filter(q => q.error).map(q => q.error?.message);
      return errors.length > 0 ? errors.join('; ') : 'No stations found';
    }
    return null;
  }, [allDone, allData.length]);

  return (
    <StationsPage
      title="Trending Stations Now"
      label="TrendingStations"
      stations={stations as any}
      loading={!allDone && !anyData}
      error={allDone && allData.length === 0 ? error : null}
    />
  );
};

export default TrendingStationsPage;
