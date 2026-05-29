import { assert } from "@/lib/invariant";
import type { Station } from "@/services/radioService";

export function assertNoDuplicateNames(
  stations: Station[],
  cell: string,
): void {
  const names = stations.map((s) => s.name.toLowerCase());
  const unique = new Set(names);
  assert(
    unique.size === names.length,
    cell,
    "no duplicate station names",
    `${names.length - unique.size} duplicates found`,
  );
}

export function assertAllHaveStreams(
  stations: Station[],
  cell: string,
): void {
  const missing = stations.filter((s) => s.streams.length === 0);
  assert(
    missing.length === 0,
    cell,
    "all stations must have at least one stream",
    `${missing.length} stations without streams`,
  );
}

export function assertGenreKnown(
  stations: Station[],
  knownGenres: Set<string>,
  cell: string,
): void {
  const unknown = stations.filter((s) => !knownGenres.has(s.genre));
  assert(
    unknown.length === 0,
    cell,
    "all stations must have a known genre",
    `unknown genres: [${unknown.map((s) => s.genre).join(", ")}]`,
  );
}
