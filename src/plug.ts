import type { BulkCircuitDef } from "./circuit.ts";
import type { Hashmap } from "./common.ts";

export interface BulkPlugin {
  __isPlugin: true;
  __circuit: BulkCircuitDef;
  __adapter: Record<string, string | Record<string, string>>;
  __inputs: Hashmap;
}

type Plugin<
  C extends BulkCircuitDef,
  A extends Record<
    string & keyof C["__inputs"],
    string | Record<string, string>
  >,
> = {
  __isPlugin: true;
  __circuit: C;
  __adapter: A;
  __inputs: Adapt<C["__inputs"], A>;
};

type Adapt<
  O extends Hashmap,
  A extends Record<string & keyof O, string | Record<string, string>>,
> = {
  [K in keyof O as string & (K extends keyof A ? A[K] : K)]: O[K];
};

export function plug<
  C extends BulkCircuitDef,
  A extends Record<
    string & keyof C["__inputs"],
    string | Record<string, string>
  >,
>(circuit: C, adapter = {} as A): Plugin<C, A> {
  return {
    __isPlugin: true,
    __circuit: circuit,
    __adapter: adapter,
    __inputs: {} as Adapt<C["__inputs"], A>,
  };
}

export function isPlugin(item: unknown): item is BulkPlugin {
  if (typeof item !== "object" || item === null) return false;
  if (
    !("__isPlugin" in item) ||
    !("__circuit" in item) ||
    !("__connector" in item)
  )
    return false;

  if (item.__isPlugin !== true) return false;

  if (typeof item.__circuit !== "object" || item.__circuit === null)
    return false;

  if (typeof item.__connector !== "object" || item.__connector === null)
    return false;

  return true;
}
