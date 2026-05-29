import { assert } from "@/lib/invariant";

export function assertNotDuplicate(
  existingIds: Set<string>,
  stationId: string,
  cell: string,
): void {
  assert(
    !existingIds.has(stationId),
    cell,
    "no duplicate favorites",
    `station ${stationId} is already favorited`,
  );
}

export function assertStationExists(
  exists: boolean,
  stationId: string,
  cell: string,
): void {
  assert(
    exists,
    cell,
    "station must exist in favorites to remove",
    `station ${stationId} not found`,
  );
}
