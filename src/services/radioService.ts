import { QueryClient, useQuery } from "@tanstack/react-query";
import { fetchStationsFromApi, searchSongFromApi, fetchCountriesFromApi } from "@/lib/radioApi";

export interface Stream {
  bitrate: number; // Store as number for easier sorting
  url: string;
}

export interface Station {
  id: string;
  name: string;
  artist?: string;
  genre: string;
  country: string;
  imageUrl: string;
  description?: string;
  // New properties for multiple streams
  streams: Stream[];
  // The currently selected stream details (for convenience in UI)
  currentStreamUrl: string;
  currentBitrate: string; // Display string like "128kbps"
}

export interface Category {
  name: string;
  searchTags: string[];
}

// The raw list of approved genre names
const rawApprovedGenres: string[] = [
  "Acoustic", "Afrobeat", "Alternative", "Ambient", "Avant-garde", "Bachata", "Ballads", "Baroque", "Bass", "Bebop", "Big Band", "Blues", "Bollywood", "Bossa Nova", "Brazilian Music", "Celtic", "Chanson", "Chillout", "Christian Contemporary", "Christian Music", "Classic Rock", "Classical", "Country", "Cumbia", "Dance", "Dancehall", "Deep House", "Disco", "Discofox", "Drum'n'Bass", "Dub", "Easy Listening", "Electro", "Electronica", "Eurodance", "Experimental", "Fado", "Folk", "Funk", "Fusion", "Garage", "Glam Rock", "Gospel", "Gothic", "Grime", "Hard Rock", "Hardcore", "Hardstyle", "Heavy Metal", "Hip Hop", "House", "Industrial", "Instrumental", "Indie", "Indian Music", "Italo Disco", "Jazz", "Jungle", "J-Pop", "K-Pop", "Kizomba", "Latin", "Latin Jazz", "Latin Music", "Lounge", "Manele", "Mariachi", "Merengue", "Metal", "Minimal", "Neo-Medieval", "New Age", "New Wave", "Oldies", "Opera", "Orchestral", "Psychedelic", "Pop", "Pop Rock", "Progressive House", "Progressive Rock", "Punk", "R&B", "Rap", "Reggae", "Reggaeton", "Rock", "Rock'n'Roll", "Roots", "Salsa", "Samba", "Schlager", "Soft Rock", "Soul", "Swing", "Talk", "Tamil", "Tango", "Techno", "Top 40 & Charts", "Traditional", "Traditional music", "Trance", "Trap", "Urban", "World", "Zouk and Tropical", "2000s", "20s 30s 40s 50s 60s", "50s", "60s", "70s", "80s", "90s",
];

// Helper to convert a simple genre string to a Category object
const createCategory = (genreName: string): Category => {
  // Split by non-alphanumeric characters (except &) and convert to lowercase
  const searchTags = genreName.toLowerCase().split(/[^a-z0-9&]+/);
  return {
    name: genreName,
    searchTags: searchTags.filter(tag => tag.length > 0), // Remove empty strings
  };
};

export const approvedCategories: Category[] = rawApprovedGenres.map(createCategory);

export const useStations = (
  textQuery?: string, // for name search
  genreSearchTags?: string[], // for tag search (array of tags)
  offset: number = 0,
  limit: number = 10,
  sortBy: string = "name",
  bitrateMin?: number,
  country?: string,
  fetchType: 'default' | 'topvote' | 'byclicks' = 'default', // New parameter
  randomizeOrder: boolean = false, // New parameter for randomizing
  randomSeed?: number, // New parameter for random seed to force new queries
) => {
  const queryKey = ["stations", textQuery, genreSearchTags, offset, limit, sortBy, bitrateMin, country, fetchType, randomizeOrder, randomSeed];

  // The query should be enabled if:
  // 1. A specific fetchType (topvote/byclicks) is requested.
  // 2. Any filter (textQuery, genre, country) is active.
  // 3. It's a default fetch (fetchType === 'default') and no filters are active (initial load).
  const isFilterActive = !!textQuery || (genreSearchTags && genreSearchTags.length > 0) || !!country;
  const shouldBeEnabled = fetchType !== 'default' || isFilterActive || (fetchType === 'default' && !isFilterActive);

  return useQuery<Station[], Error>({
    queryKey: queryKey,
    queryFn: async () => {
      return fetchStationsFromApi(textQuery, genreSearchTags, offset, limit, sortBy, bitrateMin, country, fetchType, randomizeOrder);
    },
    refetchInterval: 300000,
    staleTime: 15000,
    gcTime: 30000,
    enabled: shouldBeEnabled,
    retry: 1,
    retryDelay: 500,
  });
};

export const useGenres = () => {
  const queryKey = ["genres"];
  return useQuery<Category[], Error>({
    queryKey: queryKey,
    queryFn: async () => {
      try {
        const { fetchTagsFromApi } = await import("@/lib/radioApi");
        const apiTags = await fetchTagsFromApi();
        const existingNames = new Set(approvedCategories.map(c => c.name.toLowerCase()));
        const newCategories: Category[] = apiTags
          .filter(t => !existingNames.has(t.toLowerCase()))
          .map(t => ({
            name: t,
            searchTags: t.toLowerCase().split(/[^a-z0-9&]+/).filter(Boolean),
          }));
        return [...approvedCategories, ...newCategories];
      } catch {
        return approvedCategories;
      }
    },
    staleTime: 600000,
    gcTime: 600000,
    retry: false,
  });
};

// Define a unique key for country cache in localStorage
const COUNTRY_CACHE_KEY = JSON.stringify(["countries"]);

export const useCountries = () => {
  const queryKey = ["countries"];
  return useQuery<string[], Error>({
    queryKey: queryKey,
    queryFn: async () => {
      // Force clear old cache to ensure unique list is fetched after API fix
      if (localStorage.getItem(COUNTRY_CACHE_KEY)) {
        localStorage.removeItem(COUNTRY_CACHE_KEY);
      }
      
      const cachedData = localStorage.getItem(COUNTRY_CACHE_KEY);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
      const data = await fetchCountriesFromApi();
      localStorage.setItem(COUNTRY_CACHE_KEY, JSON.stringify(data));
      return data;
    },
    staleTime: Infinity, // Countries list doesn't change often
  });
};

export const useSongSearch = (query: string) => {
  return useQuery<Station[], Error>({
    queryKey: ["songSearch", query],
    queryFn: async () => {
      return searchSongFromApi(query);
    },
    enabled: !!query,
    staleTime: 10000, // 10 seconds stale time for search results
    gcTime: 20000, // 20 seconds garbage collection time
  });
};