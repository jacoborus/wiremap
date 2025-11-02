export type Hashmap = Record<string, unknown>;

export interface Wcache {
  unit: Map<string, unknown>;
  input: Map<string, unknown>;
  wire: Map<string, unknown>;
  proxy: Map<string, Hashmap>;
  localProxy: Map<string | null, Hashmap>;
}
