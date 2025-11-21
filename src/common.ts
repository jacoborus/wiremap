import type { BulkCircuitDef } from "./circuit.ts";

export type Hashmap = Record<string, unknown>;

export interface Context<Circuit extends BulkCircuitDef> {
  circuit: Circuit;
  unit: Map<string, unknown>;
  wire: Map<string, unknown>;
  proxy: Map<string, Hashmap>;
  localProxy: Map<string | null, Hashmap>;
}
