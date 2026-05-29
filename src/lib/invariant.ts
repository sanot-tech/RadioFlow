export class InvariantError extends Error {
  constructor(cell: string, invariant: string, detail?: string) {
    const msg = detail
      ? `[${cell}] INVARIANT VIOLATED: ${invariant} — ${detail}`
      : `[${cell}] INVARIANT VIOLATED: ${invariant}`;
    super(msg);
    this.name = "InvariantError";
  }
}

export function assert(
  condition: boolean,
  cell: string,
  invariant: string,
  detail?: string,
): asserts condition {
  if (!condition) {
    throw new InvariantError(cell, invariant, detail);
  }
}

export type TrinityCell<A, B> = {
  name: string;
  pre: (input: A) => boolean;
  post: (input: A, output: B) => boolean;
  trans: (input: A) => B;
};

export function createCell<A, B>(
  name: string,
  pre: (input: A) => boolean,
  trans: (input: A) => B,
  post: (input: A, output: B) => boolean,
): TrinityCell<A, B> {
  return { name, pre, trans, post };
}

export function executeCell<A, B>(
  cell: TrinityCell<A, B>,
  input: A,
  context?: string,
): B {
  assert(
    cell.pre(input),
    cell.name,
    "precondition",
    context ? `input: ${context}` : undefined,
  );
  const output = cell.trans(input);
  assert(
    cell.post(input, output),
    cell.name,
    "postcondition",
    context ? `output: ${context}` : undefined,
  );
  return output;
}
