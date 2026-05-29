import axios from "axios";
import { Station, Category, approvedCategories, Stream } from "@/services/radioService";

// Create axios instances with proper configuration
const createAxiosInstance = (baseUrl: string) => {
  return axios.create({
    baseURL: baseUrl,
    timeout: 15000,
  });
};

const IS_PRODUCTION = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1');
const PROXY_URL = typeof window !== 'undefined' ? `${window.location.origin}/api/radio-proxy` : '/api/radio-proxy';

const API_SERVERS = [
  ...(IS_PRODUCTION ? [PROXY_URL] : []),
  "https://de1.api.radio-browser.info/json",
  "https://de2.api.radio-browser.info/json",
  "https://at1.api.radio-browser.info/json",
];

// Cache for API responses
const apiCache = new Map<string, { data: any; timestamp: number }>();

// Helper to generate cache key
const generateCacheKey = (endpoint: string, params: any): string => {
  return `${endpoint}?${Object.keys(params).sort().map(key => `${key}=${params[key]}`).join('&')}`;
};

// Helper to check if cache is valid (within 30 seconds)
const isCacheValid = (timestamp: number, maxAge = 30000): boolean => {
  return Date.now() - timestamp < maxAge;
};

// Helper to transform a single API station entry into a Stream object
const transformApiStationToStream = (apiStation: any): Stream => {
  return {
    bitrate: apiStation.bitrate ? parseInt(apiStation.bitrate, 10) : 0,
    url: apiStation.url_resolved,
  };
};

// Fisher-Yates (Knuth) shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Helper to determine genre and artist
const getStationMetadata = (apiStation: any) => {
  const apiTags = apiStation.tags ? apiStation.tags.split(',').map((tag: string) => tag.trim().toLowerCase()) : [];
  let assignedGenre: string = "Unknown";
  let inferredArtist: string = apiStation.name;

  for (const category of approvedCategories) {
    if (category.searchTags.some(searchTag => apiTags.some(apiTag => apiTag.includes(searchTag)))) {
      assignedGenre = category.name;
      break;
    }
  }

  if (assignedGenre === "Unknown" && apiTags.length > 0) {
    const firstTag = apiTags[0];
    const matched = approvedCategories.find(c =>
      c.searchTags.some(t => firstTag.includes(t) || t.includes(firstTag))
    );
    if (matched) assignedGenre = matched.name;
  }

  const artistTag = apiTags.find((tag: string) => tag.includes('artist') || tag.includes('band'));
  if (artistTag) {
    inferredArtist = artistTag.charAt(0).toUpperCase() + artistTag.slice(1);
  }
  return { assignedGenre, inferredArtist };
};

// Try multiple API endpoints sequentially
const fetchWithFallback = async (endpoint: string, params: any) => {
  const errors: unknown[] = [];
  for (const baseURL of API_SERVERS) {
    try {
      const api = createAxiosInstance(baseURL);
      const response = await api.get(endpoint, { params });
      return response;
    } catch (err) {
      errors.push(err);
    }
  }
  throw errors[0];
};

export const fetchStationsFromApi = async (
  textQuery?: string,
  genreSearchTags?: string[],
  offset: number = 0,
  limit: number = 20, // This is the *requested* limit for the final output
  sortBy: string = "name",
  bitrateMin?: number,
  country?: string,
  fetchType: 'default' | 'topvote' | 'byclicks' = 'default',
  randomizeOrder: boolean = false,
  randomSeed?: number, // New parameter for random seed to force new queries
): Promise<Station[]> => {
  try {
    
    const baseParams: any = {
      hidebroken: true,
      order: sortBy,
      reverse: false,
      format: "json",
    };

    if (randomizeOrder && randomSeed) {
      baseParams._seed = randomSeed;
    }

    let fetchedRawStations: any[] = [];
    let finalEndpoint: string | null = "/stations/search";
    let currentRequestParams: any = { ...baseParams };

    // Determine the actual limit for the API call
    // For random order, use a smaller limit for initial fetch
    const apiCallLimit = randomizeOrder ? 100 : limit; // Reduced from 200 to 100
    currentRequestParams.limit = apiCallLimit; 

    if (fetchType === 'topvote') {
      finalEndpoint = "/stations/topvote";
    } else if (fetchType === 'byclicks') {
      finalEndpoint = "/stations/byclicks";
    } else if (genreSearchTags && genreSearchTags.length > 0) {
      const allFetchedStationsMap: Map<string, any> = new Map();
      // For genre search, we'll fetch from the first tag only to improve performance
      // We'll fetch fewer stations per tag to reduce load time
      const internalFetchLimitPerTag = limit; // Reduced from limit * 2 to just limit

      for (const singleTag of genreSearchTags.slice(0, 1)) { // Only take the first tag to improve performance
        const tagParams = { ...baseParams, tag: singleTag, limit: internalFetchLimitPerTag };
        if (country) tagParams.country = country;
        if (textQuery) tagParams.name = textQuery;
        if (bitrateMin) tagParams.bitrateMin = bitrateMin;
        if (randomizeOrder) {
          tagParams.order = "random";
          delete tagParams.offset; // Offset doesn't make sense with random order
        } else {
          tagParams.offset = offset;
        }

        // Generate cache key
        const cacheKey = generateCacheKey("/stations/search", tagParams);
        const skipCache = randomizeOrder;
        
        // Check cache first (skip cache for random requests)
        if (!skipCache && apiCache.has(cacheKey) && isCacheValid(apiCache.get(cacheKey)!.timestamp)) {
          const cachedData = apiCache.get(cacheKey)!.data;
          cachedData.forEach((station: any) => {
            if (!allFetchedStationsMap.has(station.stationuuid)) {
              allFetchedStationsMap.set(station.stationuuid, station);
            }
          });
        } else {
          try {
            const tagResponse = await fetchWithFallback("/stations/search", tagParams);
            
            // Cache the response (unless random)
            if (!skipCache) {
              apiCache.set(cacheKey, { data: tagResponse.data, timestamp: Date.now() });
            }
            
            tagResponse.data.forEach((station: any) => {
              if (!allFetchedStationsMap.has(station.stationuuid)) {
                allFetchedStationsMap.set(station.stationuuid, station);
              }
            });
          } catch (error) {
            // Continue with other tags even if one fails
          }
        }
      }
      fetchedRawStations = Array.from(allFetchedStationsMap.values());
      finalEndpoint = null; // No single final endpoint for this case
    } else { // Default search (text, country, or no specific filter)
      finalEndpoint = "/stations/search";
      if (textQuery) {
        currentRequestParams.name = textQuery;
      }
      if (country) {
        currentRequestParams.country = country;
      }
      if (bitrateMin) {
        currentRequestParams.bitrateMin = bitrateMin;
      }
      
      if (randomizeOrder) {
        currentRequestParams.order = "random";
        delete currentRequestParams.offset; // Offset doesn't make sense with random order
      } else {
        currentRequestParams.offset = offset;
      }
      
      // Generate cache key
      const cacheKey = generateCacheKey(finalEndpoint, currentRequestParams);
      const skipCache = randomizeOrder;
      
      // Check cache first (skip cache for random requests)
      if (!skipCache && apiCache.has(cacheKey) && isCacheValid(apiCache.get(cacheKey)!.timestamp)) {
        fetchedRawStations = apiCache.get(cacheKey)!.data;
      } else {
        try {
          const response = await fetchWithFallback(finalEndpoint, currentRequestParams);
          
          // Cache the response (unless random)
          if (!skipCache) {
            apiCache.set(cacheKey, { data: response.data, timestamp: Date.now() });
          }
          fetchedRawStations = response.data;
        } catch (error) {
          return []; // Return empty array instead of throwing
        }
      }
    }

    // Client-side filtering for 'topvote'/'byclicks' if other filters are active
    let filteredRawStations = fetchedRawStations;
    if (fetchType === 'topvote' || fetchType === 'byclicks') {
        filteredRawStations = fetchedRawStations.filter(apiStation => {
            const apiTags = apiStation.tags ? apiStation.tags.split(',').map((tag: string) => tag.trim().toLowerCase()) : [];
            const matchesGenre = genreSearchTags && genreSearchTags.length > 0
                ? genreSearchTags.some(searchTag => apiTags.includes(searchTag))
                : true;
            const matchesCountry = country ? apiStation.country === country : true;
            const matchesTextQuery = textQuery ? 
                apiStation.name.toLowerCase().includes(textQuery.toLowerCase()) ||
                apiStation.tags.toLowerCase().includes(textQuery.toLowerCase()) ||
                apiStation.country.toLowerCase().includes(textQuery.toLowerCase()) : true;
            return matchesGenre && matchesCountry && matchesTextQuery;
        });
    }

    // Deduplicate by station name (case-insensitive)
    const groupedStations = new Map<string, { mainInfo: any; streams: Stream[] }>();

    for (const apiStation of filteredRawStations) {
      const uniqueStationNameKey = apiStation.name.toLowerCase();

      if (!uniqueStationNameKey) continue;

      if (!groupedStations.has(uniqueStationNameKey)) {
        groupedStations.set(uniqueStationNameKey, {
          mainInfo: apiStation,
          streams: [],
        });
      }
      const stationEntry = groupedStations.get(uniqueStationNameKey)!;
      const newStream = transformApiStationToStream(apiStation);
      
      if (newStream.url && !stationEntry.streams.some(s => s.url === newStream.url)) {
        stationEntry.streams.push(newStream);
      }
    }

    let finalStations: Station[] = [];
    for (const [uniqueStationKey, entry] of groupedStations.entries()) {
      const { assignedGenre, inferredArtist } = getStationMetadata(entry.mainInfo);

      if (assignedGenre === "Unknown") {
        continue;
      }

      entry.streams.sort((a, b) => b.bitrate - a.bitrate);
      const defaultStream = entry.streams.length > 0 ? entry.streams[0] : null;

      if (defaultStream) {
        finalStations.push({
          id: entry.mainInfo.stationuuid,
          name: entry.mainInfo.name,
          artist: inferredArtist,
          genre: assignedGenre,
          country: entry.mainInfo.country || "Unknown",
          imageUrl: entry.mainInfo.favicon || "https://picsum.photos/seed/radio/200/200",
          description: entry.mainInfo.name,
          streams: entry.streams,
          currentStreamUrl: defaultStream.url,
          currentBitrate: `${defaultStream.bitrate}kbps`,
        });
      }
    }
    
    let resultStations: Station[] = [];
    if (randomizeOrder) {
      // If random mode, shuffle all unique stations and return 'limit' of them
      resultStations = shuffleArray(finalStations).slice(0, limit);
    } else {
      // Otherwise, slice to the requested 'limit'
      resultStations = finalStations.slice(0, limit);
    }

    return resultStations;

  } catch (error) {
    return [];
  }
};

export const fetchCountriesFromApi = async (): Promise<string[]> => {
  try {
    const response = await fetchWithFallback("/countries", {});
    // The API returns an array of objects like { name: "Country Name", stationcount: N }
    
    const uniqueCountryNames = new Set<string>();
    
    response.data
      .filter((c: any) => c.stationcount > 0) // Only include countries with stations
      .forEach((c: any) => {
          // Add the name to the set, which automatically handles duplicates
          uniqueCountryNames.add(c.name);
      });
      
    const countries = Array.from(uniqueCountryNames)
      .sort((a: string, b: string) => a.localeCompare(b)); // Sort alphabetically
      
    return countries;
  } catch (error) {
    return [];
  }
};

export const fetchTagsFromApi = async (): Promise<string[]> => {
  try {
    const response = await Promise.race([
      fetchWithFallback("/tags", {}),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('tags timeout')), 8000)),
    ]);
    return response.data
      .filter((t: any) => t.stationcount > 5)
      .map((t: any) => t.name)
      .filter((n: string) => /^[a-zA-Z0-9&.\s\-]+$/.test(n) && n.length > 1)
      .filter((n: string) => !/^[\d.]+(fm|am|kbps|mhz|kbit)?$/i.test(n))
      .filter((n: string) => !/^[./,#@]+$/.test(n))
      .slice(0, 200);
  } catch {
    return [];
  }
};

export const searchSongFromApi = async (query: string): Promise<Station[]> => {
  try {
    
    // Use a smaller limit for search to improve performance
    const response = await fetchWithFallback("/stations/search", { name: query, hidebroken: true, limit: 50 });
    const rawApiStations: any[] = response.data;

    // Deduplicate by station name (case-insensitive)
    const groupedStations = new Map<string, { mainInfo: any; streams: Stream[] }>();

    for (const apiStation of rawApiStations) {
      const uniqueStationNameKey = apiStation.name.toLowerCase(); // Use name for primary deduplication
      if (!uniqueStationNameKey) continue;

      if (!groupedStations.has(uniqueStationNameKey)) {
        groupedStations.set(uniqueStationNameKey, {
          mainInfo: apiStation,
          streams: [],
        });
      }
      const stationEntry = groupedStations.get(uniqueStationNameKey)!;
      const newStream = transformApiStationToStream(apiStation);
      if (newStream.url && !stationEntry.streams.some(s => s.url === newStream.url)) {
        stationEntry.streams.push(newStream);
      }
    }

    let finalStations: Station[] = [];
    for (const [key, entry] of groupedStations.entries()) {
      const { assignedGenre, inferredArtist } = getStationMetadata(entry.mainInfo);

      if (assignedGenre === "Unknown") {
        continue;
      }

      entry.streams.sort((a, b) => b.bitrate - a.bitrate);
      const defaultStream = entry.streams.length > 0 ? entry.streams[0] : null;

      if (defaultStream) {
        finalStations.push({
          id: entry.mainInfo.stationuuid,
          name: entry.mainInfo.name,
          artist: inferredArtist,
          genre: assignedGenre,
          country: entry.mainInfo.country || "Unknown",
          imageUrl: entry.mainInfo.favicon || "https://picsum.photos/seed/radio/200/200",
          description: entry.mainInfo.name,
          streams: entry.streams,
          currentStreamUrl: defaultStream.url,
          currentBitrate: `${defaultStream.bitrate}kbps`,
        });
      }
    }
    
    const filteredByQuery = finalStations
      .filter((station: Station) => 
        station.name.toLowerCase().includes(query.toLowerCase()) || 
        station.description?.toLowerCase().includes(query.toLowerCase()) || 
        station.genre.toLowerCase().includes(query.toLowerCase()) ||
        station.artist?.toLowerCase().includes(query.toLowerCase())
      );

    return filteredByQuery;

  } catch (error) {
    return [];
  }
};