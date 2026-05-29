import { assert } from "@/lib/invariant";

export type PlayerState = "idle" | "loading" | "playing" | "paused" | "error";

export type PlayerTransition =
  | { type: "PLAY"; stationId: string }
  | { type: "PAUSE" }
  | { type: "TOGGLE" }
  | { type: "LOAD_START"; stationId: string }
  | { type: "LOAD_END"; stationId: string }
  | { type: "ERROR"; message: string }
  | { type: "TIMEOUT" }
  | { type: "ENDED" }
  | { type: "SET_VOLUME"; volume: number };

type PlayerStateMachine = {
  current: PlayerState;
  stationId: string | null;
  volume: number;
};

const ALLOWED_TRANSITIONS: Record<PlayerState, PlayerState[]> = {
  idle: ["loading"],
  loading: ["playing", "error", "idle"],
  playing: ["paused", "loading", "error", "idle"],
  paused: ["playing", "idle"],
  error: ["loading", "idle"],
};

export function assertValidTransition(
  from: PlayerState,
  to: PlayerState,
  cell: string,
): void {
  assert(
    ALLOWED_TRANSITIONS[from].includes(to),
    cell,
    `invalid transition: ${from} → ${to}`,
    `allowed: [${ALLOWED_TRANSITIONS[from].join(", ")}]`,
  );
}

export function createPlayerMachine(initialVolume = 0.4): PlayerStateMachine {
  return { current: "idle", stationId: null, volume: initialVolume };
}

export function validateVolume(volume: number, cell: string): void {
  assert(volume >= 0, cell, "volume ≥ 0", `got ${volume}`);
  assert(volume <= 1, cell, "volume ≤ 1", `got ${volume}`);
}
