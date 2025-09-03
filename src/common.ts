export const unitSymbol = Symbol("UnitSymbol");
export const blockSymbol = Symbol("BlockSymbol");

export type Hashmap = Record<string, unknown>;

export interface Wcache {
  unit: Map<string, unknown>;
  wire: Map<string, unknown>;
  proxy: Map<string, Hashmap>;
  localProxy: Map<string | null, Hashmap>;
}
