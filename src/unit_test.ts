import { assertEquals, assertThrows } from "@std/assert";
import {
  defineUnit,
  isBoundFunc,
  isBoundDef,
  isPrivate,
  isFactoryFunc,
} from "./unit.ts";
import { unitSymbol } from "./common.ts";

Deno.test("unit: defineUnit", async () => {
  // Plain definition
  const plainDef = defineUnit(5);
  assertEquals(plainDef[unitSymbol], 5, "plain - defineUnit");

  // Bound definition
  const boundDef = defineUnit(
    function (this: w) {
      return 5;
    },
    { isBound: true },
  );
  assertEquals(boundDef[unitSymbol](), 5, "bound - defineUnit");

  assertThrows(
    () => defineUnit(5, { isBound: true }),
    "defineUnit throws on not function bound unit",
  );

  // Factory definition
  const factoryDef = defineUnit(
    function (w: w) {
      return w;
    },
    { isFactory: true },
  );
  assertEquals(factoryDef[unitSymbol](5), 5, "factory - defineUnit");

  assertThrows(
    () => defineUnit(5, { isFactory: true }),
    "defineUnit throws on not function factory unit",
  );

  // Async factory definition
  const asyncFactoryDef = defineUnit(
    function (w: w) {
      return new Promise((res) => res(w));
    },
    { isFactory: true, isAsync: true },
  );
  assertEquals(
    await asyncFactoryDef[unitSymbol](5),
    5,
    "async factory - defineUnit",
  );

  assertThrows(
    () => defineUnit(5, { isFactory: true, isAsync: true }),
    "defineUnit throws on not function async factory unit",
  );
});

Deno.test("unit: isPrivate", () => {
  const pub1 = 5;
  const pub2 = { a: 1, isPrivate: true };
  const pubDef1 = defineUnit(5);
  const pubDef2 = defineUnit(function () {});

  assertEquals(isPrivate(pub1), false);
  assertEquals(isPrivate(pub2), false);
  assertEquals(isPrivate(pubDef1), false);
  assertEquals(isPrivate(pubDef2), false);

  function priv1() {}
  priv1.isPrivate = true as const;

  const privDef = defineUnit(5, { isPrivate: true });

  assertEquals(isPrivate(priv1), true);
  assertEquals(isPrivate(privDef), true);
});

Deno.test("unit: isBoundFunc", () => {
  const ex1 = 5;
  const ex2 = { a: 1, isBound: true };
  const exDef1 = defineUnit(5);
  const exDef2 = defineUnit(function () {});

  assertEquals(isBoundFunc(ex1), false);
  assertEquals(isBoundFunc(ex2), false);
  assertEquals(isBoundFunc(exDef1), false);
  assertEquals(isBoundFunc(exDef2), false);

  function boundFunc() {}
  boundFunc.isBound = true as const;
  const boundDef = defineUnit(
    function (this: W, a: number) {
      return a;
    },
    { isBound: true },
  );

  assertEquals(isBoundFunc(boundFunc), true);
  assertEquals(isBoundFunc(boundDef), false);
});

Deno.test("unit: isFactoryFunc", () => {
  const ex1 = 5;
  const ex2 = { a: 1, isFactory: true };
  const exDef1 = defineUnit(5);
  const exDef2 = defineUnit(function () {});

  assertEquals(isFactoryFunc(ex1), false);
  assertEquals(isFactoryFunc(ex2), false);
  assertEquals(isFactoryFunc(exDef1), false);
  assertEquals(isFactoryFunc(exDef2), false);

  function factoFunc() {}
  factoFunc.isFactory = true as const;

  const factoDef = defineUnit(
    function (this: W, a: number) {
      return a;
    },
    { isFactory: true },
  );

  assertEquals(isFactoryFunc(factoFunc), true);
  assertEquals(isFactoryFunc(factoDef), false);
});

Deno.test("unit: isBoundDef", () => {
  const ex1 = 5;
  const ex2 = { a: 1, isBound: true };
  const exDef1 = defineUnit(5);
  const exDef2 = defineUnit(function () {});

  assertEquals(isBoundDef(ex1), false);
  assertEquals(isBoundDef(ex2), false);
  assertEquals(isBoundDef(exDef1), false);
  assertEquals(isBoundDef(exDef2), false);

  function boundFunc() {}
  boundFunc.isBound = true as const;
  assertEquals(isBoundDef(boundFunc), false);

  const boundDef = defineUnit(
    function (this: W, a: number) {
      return a;
    },
    { isBound: true },
  );
  assertEquals(isBoundDef(boundDef), true);
});
