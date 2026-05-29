import type { Station } from "@/types/radio";

const STORAGE_KEY = 'radioflow_recent_stations';
const MAX_RECENT = 8;

export function getRecentStations(): Station[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function addRecentStation(station: Station): void {
  try {
    const recent = getRecentStations().filter(s => s.id !== station.id);
    recent.unshift(station);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
  } catch { /* ignore */ }
}
