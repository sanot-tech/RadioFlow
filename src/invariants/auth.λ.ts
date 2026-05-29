import { assert } from "@/lib/invariant";

export type AuthState = "loading" | "authenticated" | "unauthenticated";

export function assertAuthRequired(user: unknown, cell: string): asserts user is NonNullable<typeof user> {
  assert(
    user != null,
    cell,
    "user must be authenticated",
    "this operation requires a logged-in user",
  );
}
