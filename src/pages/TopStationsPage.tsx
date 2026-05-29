import React, { useMemo } from 'react';
import StationsPage from "./StationsPage";
import { useStations } from "@/services/radioService";

const GENRE_SETS = [
  ['pop', 'top', 'charts'],
  ['rock', 'alternative', 'indie'],
  ['electronic', 'dance', 'house'],
  ['jazz', 'blues', 'soul'],
  ['hip-hop', 'rap', 'rnb'],
  ['latin', 'reggaeton', 'salsa'],
  ['country', 'folk', 'americana'],
  ['classical', 'ambient', 'chill'],
  ['reggae', 'world', 'afrobeat'],
  ['metal', 'punk', 'hardcore'],
];

const TopStationsPage: React.FC = () => {
  const seed = useMemo(() => Date.now(), []);
  const queries = GENRE_SETS.map((genres, i) =>
    useStations(undefined, genres, 0, 120, 'random', undefined, undefined, 'default', true, seed + i)
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
    return unique.sort(() => Math.random() - 0.5).slice(0, 400);
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
      title="Top Trending Stations"
      label="TopStations"
      stations={stations as any}
      loading={!allDone && !anyData}
      error={allDone && allData.length === 0 ? error : null}
    />
  );
};

export default TopStationsPage;
