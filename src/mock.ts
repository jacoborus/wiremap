import { Hashmap, unitSymbol } from "./common.ts";
import {
  isUnitDef,
  isBoundFunc,
  isBoundDef,
  isFactoryFunc,
  isFactoryDef,
  // isAsyncFactoryFunc, // TODO
  // isAsyncFactoryDef, // TODO
} from "./unit.ts";
import type { InferUnitValue } from "./unit.ts";

function fakeWire<F extends Hashmap>(fakeBlocks: F) {
  return function <P extends "" | keyof F>(blockPath = "" as P) {
    return fakeBlocks[blockPath];
  };
}

export function mockUnit<T>(def: T, fakeBlocks: Hashmap): InferUnitValue<T> {
  const wire = fakeWire(fakeBlocks);

  if (isUnitDef(def)) {
    if (isFactoryDef(def)) {
      const defValue = def[unitSymbol];
      return defValue(wire) as InferUnitValue<T>;
    }

    if (isBoundDef(def)) {
      const defValue = def[unitSymbol];
      return defValue.bind(wire);
    }

    return def[unitSymbol] as InferUnitValue<T>;
  }

  if (isBoundFunc(def)) {
    return def.bind(wire);
  }

  if (isFactoryFunc(def)) {
    return def(wire) as InferUnitValue<T>;
  }

  return def as InferUnitValue<T>;
}
