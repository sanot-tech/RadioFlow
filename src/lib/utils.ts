import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const GENERIC_IMAGE_URL = "https://picsum.photos/seed/radio/200/200"; // Moved from stationFormatter.tsx

/**
 * Cleans a raw station name by removing noise, bitrate info, numbers,
 * collapsing spaces, trimming, and capitalizing each word.
 */
const stationNameMap: Record<string, string> = {
  'biopasks': 'Sanot',
  'biopask': 'Sanot',
};

export function isGlowStation(name: string): boolean {
  return name.toLowerCase().trim() === 'sanot';
}

export function cleanStationName(raw: string): string {
  const lower = raw.toLowerCase().trim();
  if (stationNameMap[lower]) return stationNameMap[lower];
  return raw
    // remove bitrate and frequencies (e.g., (0kbps), 128kbps, 87.5 MHz)
    .replace(/\(?\s*\d+([.,]\d+)?\s*(kbps|mhz|Hz)?\s*\)?/gi, "")
    // remove ordinal numbers (#1, No.1 etc.)
    .replace(/\b(no\.?|#)\s*\d+/gi, "")
    // remove all special characters except letters, digits, spaces and ampersands
    .replace(/[^a-zA-Z0-9\s&]+/g, " ")
    // collapse whitespace
    .replace(/\s+/g, " ")
    // trim leading/trailing whitespace
    .trim()
    // capitalize each word
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const PROXY_BASE = '/audio-proxy';

export function isProxyAvailable(): boolean {
  return typeof window !== 'undefined';
}

export function getProxiedStreamUrl(originalUrl: string): string {
  if (!originalUrl || !isProxyAvailable()) return originalUrl;
  const encoded = encodeURIComponent(originalUrl);
  return `${PROXY_BASE}?url=${encoded}`;
}

export function shortenCountryName(countryName: string): string {
  switch (countryName) {
    case "United Kingdom Of Great Britain And Northern Ireland":
      return "UK";
    case "United States of America":
      return "USA";
    case "Russian Federation":
      return "Russia";
    case "Germany":
      return "Germany";
    case "France":
      return "France";
    case "Italy":
      return "Italy";
    case "Spain":
      return "Spain";
    case "Canada":
      return "Canada";
    case "Australia":
      return "Australia";
    case "Japan":
      return "Japan";
    case "China":
      return "China";
    case "India":
      return "India";
    case "Brazil":
      return "Brazil";
    case "Mexico":
      return "Mexico";
    case "South Korea":
      return "S. Korea";
    case "Netherlands":
      return "Netherlands";
    case "Sweden":
      return "Sweden";
    case "Norway":
      return "Norway";
    case "Denmark":
      return "Denmark";
    case "Finland":
      return "Finland";
    case "Poland":
      return "Poland";
    case "Belgium":
      return "Belgium";
    case "Austria":
      return "Austria";
    case "Switzerland":
      return "Switz.";
    case "Portugal":
      return "Portugal";
    case "Greece":
      return "Greece";
    case "Turkey":
      return "Turkey";
    case "Saudi Arabia":
      return "S. Arabia";
    case "United Arab Emirates":
      return "UAE";
    case "South Africa":
      return "S. Africa";
    case "Egypt":
      return "Egypt";
    case "Israel":
      return "Israel";
    case "Argentina":
      return "Argentina";
    case "Chile":
      return "Chile";
    case "Colombia":
      return "Colombia";
    case "Peru":
      return "Peru";
    case "Venezuela":
      return "Venezuela";
    case "Singapore":
      return "Singapore";
    case "Malaysia":
      return "Malaysia";
    case "Thailand":
      return "Thailand";
    case "Indonesia":
      return "Indonesia";
    case "Philippines":
      return "Phils.";
    case "Vietnam":
      return "Vietnam";
    case "Pakistan":
      return "Pakistan";
    case "Bangladesh":
      return "Bangladesh";
    case "Nigeria":
      return "Nigeria";
    case "Kenya":
      return "Kenya";
    case "Morocco":
      return "Morocco";
    case "Algeria":
      return "Algeria";
    case "Ghana":
      return "Ghana";
    case "Ethiopia":
      return "Ethiopia";
    case "Ukraine":
      return "Ukraine";
    case "Romania":
      return "Romania";
    case "Hungary":
      return "Hungary";
    case "Czech Republic":
      return "Czech Rep.";
    case "Ireland":
      return "Ireland";
    case "New Zealand":
      return "NZ";
    case "Belarus":
      return "Belarus";
    case "Kazakhstan":
      return "Kazakhstan";
    case "Uzbekistan":
      return "Uzbek.";
    case "Jordan":
      return "Jordan";
    case "Iraq":
      return "Iraq";
    case "Iran":
      return "Iran";
    case "Syria":
      return "Syria";
    case "Lebanon":
      return "Lebanon";
    case "Libya":
      return "Libya";
    case "Tunisia":
      return "Tunisia";
    case "Algeria":
      return "Algeria";
    case "Mauritius":
      return "Mauritius";
    case "Sri Lanka":
      return "Sri Lanka";
    case "Cambodia":
      return "Cambodia";
    case "Laos":
      return "Laos";
    case "Myanmar":
      return "Myanmar";
    case "Mongolia":
      return "Mongolia";
    case "Kuwait":
      return "Kuwait";
    case "Qatar":
      return "Qatar";
    case "Oman":
      return "Oman";
    case "Bahrain":
      return "Bahrain";
    case "Yemen":
      return "Yemen";
    case "Sudan":
      return "Sudan";
    case "Angola":
      return "Angola";
    case "Zambia":
      return "Zambia";
    case "Zimbabwe":
      return "Zimb.";
    case "Tanzania":
      return "Tanzania";
    case "Uganda":
      return "Uganda";
    case "Cameroon":
      return "Cameroon";
    case "Senegal":
      return "Senegal";
    case "Gambia":
      return "Gambia";
    case "Botswana":
      return "Botswana";
    case "Namibia":
      return "Namibia";
    case "Mozambique":
      return "Mozambique";
    case "Madagascar":
      return "Madagascar";
    case "Malawi":
      return "Malawi";
    case "Mali":
      return "Mali";
    case "Burkina Faso":
      return "Burkina";
    case "Guinea":
      return "Guinea";
    case "Guinea-Bissau":
      return "G. Bissau";
    case "Cape Verde":
      return "C. Verde";
    case "São Tomé and Príncipe":
      return "S.T.P.";
    case "Comoros":
      return "Comoros";
    case "Seychelles":
      return "Seych.";
    case "Djibouti":
      return "Djibouti";
    case "Eritrea":
      return "Eritrea";
    case "Somalia":
      return "Somalia";
    case "Central African Republic":
      return "CAR";
    case "Chad":
      return "Chad";
    case "Republic of the Congo":
      return "Congo";
    case "Democratic Republic of the Congo":
      return "DRC";
    case "Equatorial Guinea":
      return "Eq. Guinea";
    case "Gabon":
      return "Gabon";
    case "Republic of the Sudan":
      return "Sudan";
    case "South Sudan":
      return "S. Sudan";
    case "Burundi":
      return "Burundi";
    case "Rwanda":
      return "Rwanda";
    case "Lesotho":
      return "Lesotho";
    case "Swaziland":
      return "Eswatini";
    case "Benin":
      return "Benin";
    case "Togo":
      return "Togo";
    case "Sierra Leone":
      return "Sierra L.";
    case "Liberia":
      return "Liberia";
    case "Côte d'Ivoire":
      return "Ivory Coast";
    case "Ghana":
      return "Ghana";
    case "Togo":
      return "Togo";
    case "Benin":
      return "Benin";
    case "Niger":
      return "Niger";
    case "Mauritania":
      return "Mauritania";
    case "Western Sahara":
      return "W. Sahara";
    case "Morocco":
      return "Morocco";
    case "Tunisia":
      return "Tunisia";
    case "Libya":
      return "Libya";
    case "Egypt":
      return "Egypt";
    case "Sudan":
      return "Sudan";
    case "Ethiopia":
      return "Ethiopia";
    case "Eritrea":
      return "Eritrea";
    case "Djibouti":
      return "Djibouti";
    case "Somalia":
      return "Somalia";
    case "Uganda":
      return "Uganda";
    case "Kenya":
      return "Kenya";
    case "Tanzania":
      return "Tanzania";
    case "Mozambique":
      return "Mozambique";
    case "Madagascar":
      return "Madagascar";
    case "Comoros":
      return "Comoros";
    case "Mayotte":
      return "Mayotte";
    case "Réunion":
      return "Réunion";
    case "Mauritius":
      return "Mauritius";
    case "Seychelles":
      return "Seych.";
    case "Malawi":
      return "Malawi";
    case "Zambia":
      return "Zambia";
    case "Zimbabwe":
      return "Zimb.";
    case "Botswana":
      return "Botswana";
    case "Namibia":
      return "Namibia";
    case "South Africa":
      return "S. Africa";
    case "Angola":
      return "Angola";
    case "Democratic Republic of the Congo":
      return "DRC";
    case "Republic of the Congo":
      return "Congo";
    case "Gabon":
      return "Gabon";
    case "Cameroon":
      return "Cameroon";
    case "Central African Republic":
      return "CAR";
    case "Chad":
      return "Chad";
    case "Sudan":
      return "Sudan";
    case "Ethiopia":
      return "Ethiopia";
    case "Djibouti":
      return "Djibouti";
    case "Eritrea":
      return "Eritrea";
    case "Somalia":
      return "Somalia";
    case "Uganda":
      return "Uganda";
    case "Kenya":
      return "Kenya";
    case "Tanzania":
      return "Tanzania";
    case "Mozambique":
      return "Mozambique";
    case "Madagascar":
      return "Madagascar";
    case "Comoros":
      return "Comoros";
    case "Mayotte":
      return "Mayotte";
    case "Réunion":
      return "Réunion";
    case "Mauritius":
      return "Mauritius";
    case "Seychelles":
      return "Seych.";
    case "Malawi":
      return "Malawi";
    case "Zambia":
      return "Zambia";
    case "Zimbabwe":
      return "Zimb.";
    case "Botswana":
      return "Botswana";
    case "Namibia":
      return "Namibia";
    case "South Africa":
      return "S. Africa";
    case "Lesotho":
      return "Lesotho";
    case "Eswatini":
      return "Eswatini";
    case "Mozambique":
      return "Mozambique";
    case "Zimbabwe":
      return "Zimb.";
    case "Botswana":
      return "Botswana";
    case "Namibia":
      return "Namibia";
    case "South Africa":
      return "S. Africa";
    case "Lesotho":
      return "Lesotho";
    case "Eswatini":
      return "Eswatini";
    default:
      if (countryName.startsWith("The ")) {
        return countryName.substring(4); // Remove "The "
      }
      return countryName;
  }
}