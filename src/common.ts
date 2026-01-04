import type { BulkCircuitDef } from "./circuit.ts";

export type Hashmap = Record<string, unknown>;

export interface Context<Circuit extends BulkCircuitDef> {
  circuit: Circuit;
  unit: Map<string, unknown>;
  wire: Map<string, unknown>;
  proxy: Map<string, Hashmap>;
  localProxy: Map<string | null, Hashmap>;
  adapters: AdaptersMap;
}

export type AdaptersMap = Map<
  string,
  Record<string, string | Record<string, string>>
>;

/**
 * Transforms `A | B | C` into `A & B & C`
 */
export type UnionToIntersection<U> = (
  U extends unknown ? (x: U) => void : never
) extends (x: infer I) => void
  ? I
  : never;
