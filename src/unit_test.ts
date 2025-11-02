import { assertEquals, assertThrows } from "@std/assert";
import {
  defineUnit,
  isAsyncFactoryDef,
  isAsyncFactoryFunc,
  isBoundDef,
  isBoundFunc,
  isFactoryDef,
  isFactoryFunc,
  isPrivate,
  isUnitDef,
} from "./unit.ts";

Deno.test("unit: defineUnit", async () => {
  // Plain definition
  const plainDef = defineUnit(5);
  assertEquals(plainDef.__unit, 5, "plain - defineUnit");
  type W = () => number;

  // Bound definition
  const boundDef = defineUnit(
    function (this: W) {
      return this();
    },
    { is: "bound" },
  );
  const w = () => 5;
  const finalUnit = boundDef.__unit.bind(w);

  assertEquals(finalUnit(), 5, "bound - defineUnit");

  assertThrows(
    () => defineUnit(5, { is: "bound" }),
    "defineUnit throws on not function bound unit",
  );

  type WW = unknown;
  // Factory definition
  const factoryDef = defineUnit(
    function (w: WW) {
      return w;
    },
    { is: "factory" },
  );
  assertEquals(factoryDef.__unit(5), 5, "factory - defineUnit");

  assertThrows(
    // TODO: check why this is not throwing TS error
    // @ts-ignore: just for the test
    () => defineUnit(5, { is: "factory" }),
    "defineUnit throws on not function factory unit",
  );
  type WWW = () => number;

  // Async factory definition
  const asyncFactoryDef = defineUnit(
    function (w: WWW) {
      return new Promise((res) => res(w()));
    },
    { is: "asyncFactory" },
  );
  assertEquals(
    await asyncFactoryDef.__unit(() => 5),
    5,
    "async factory - defineUnit",
  );

  assertThrows(
    () => defineUnit(5, { is: "asyncFactory" }),
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
  const ex2 = { a: 1, is: "bound" };
  const exDef1 = defineUnit(5);
  const exDef2 = defineUnit(function () {});

  assertEquals(isBoundFunc(ex1), false);
  assertEquals(isBoundFunc(ex2), false);
  assertEquals(isBoundFunc(exDef1), false);
  assertEquals(isBoundFunc(exDef2), false);

  function boundFunc() {}
  boundFunc.is = "bound" as const;
  type W = () => number;

  const boundDef = defineUnit(
    function (this: W, a: number) {
      return this() + a;
    },
    { is: "bound" },
  );

  assertEquals(isBoundFunc(boundFunc), true);
  assertEquals(isBoundFunc(boundDef), false);
});

Deno.test("unit: isBoundDef", () => {
  const ex1 = 5;
  const ex2 = { a: 1, is: "bound" };
  const exDef1 = defineUnit(5);
  const exDef2 = defineUnit(function () {});

  assertEquals(isBoundDef(ex1), false);
  assertEquals(isBoundDef(ex2), false);
  assertEquals(isBoundDef(exDef1), false);
  assertEquals(isBoundDef(exDef2), false);

  function boundFunc() {}
  boundFunc.is = "bound" as const;
  assertEquals(isBoundDef(boundFunc), false);

  type W = () => number;
  const boundDef = defineUnit(
    function (this: W, a: number) {
      return a;
    },
    { is: "bound" },
  );
  assertEquals(isBoundDef(boundDef), true);
});

Deno.test("unit: isFactoryFunc", () => {
  const ex1 = 5;
  const ex2 = { a: 1, is: "factory" };
  const exDef1 = defineUnit(5);
  const exDef2 = defineUnit(function () {});

  assertEquals(isFactoryFunc(ex1), false);
  assertEquals(isFactoryFunc(ex2), false);
  assertEquals(isFactoryFunc(exDef1), false);
  assertEquals(isFactoryFunc(exDef2), false);

  function factoFunc() {}
  factoFunc.is = "factory" as const;

  type W = () => number;
  const factoDef = defineUnit(
    function (w: W) {
      return (a: number) => w() + a;
    },
    { is: "factory" },
  );

  assertEquals(isFactoryFunc(factoFunc), true);
  assertEquals(isFactoryFunc(factoDef), false);
});

Deno.test("unit: isFactoryDef", () => {
  const ex1 = 5;
  const ex2 = { a: 1, is: "factory" };
  const exDef1 = defineUnit(5);
  const exDef2 = defineUnit(function () {});

  assertEquals(isFactoryDef(ex1), false);
  assertEquals(isFactoryDef(ex2), false);
  assertEquals(isFactoryDef(exDef1), false);
  assertEquals(isFactoryDef(exDef2), false);

  function factoFunc() {}
  factoFunc.is = "factory" as const;

  type W = () => number;
  const factoDef = defineUnit(
    function (w: W) {
      return (a: number) => w() + a;
    },
    { is: "factory" },
  );

  assertEquals(isFactoryDef(factoFunc), false);
  assertEquals(isFactoryDef(factoDef), true);
});

Deno.test("unit: isAsyncFactoryFunc", () => {
  const ex1 = 5;
  const ex2 = { a: 1, is: "asyncFactory" };
  const exDef1 = defineUnit(5);
  const exDef2 = defineUnit(function () {});

  assertEquals(isAsyncFactoryFunc(ex1), false);
  assertEquals(isAsyncFactoryFunc(ex2), false);
  assertEquals(isAsyncFactoryFunc(exDef1), false);
  assertEquals(isAsyncFactoryFunc(exDef2), false);

  function factoFunc() {}
  factoFunc.is = "asyncFactory" as const;

  type W = () => number;
  const factoDef = defineUnit(
    function (this: W, a: number) {
      return a + this();
    },
    { is: "asyncFactory" },
  );

  assertEquals(isAsyncFactoryFunc(factoFunc), true);
  assertEquals(isAsyncFactoryFunc(factoDef), false);
});

Deno.test("unit: isAsyncFactoryDef", () => {
  const ex1 = 5;
  const ex2 = { a: 1, isFactory: true, isAsync: true };
  const exDef1 = defineUnit(5);
  const exDef2 = defineUnit(function () {});

  assertEquals(isAsyncFactoryDef(ex1), false);
  assertEquals(isAsyncFactoryDef(ex2), false);
  assertEquals(isAsyncFactoryDef(exDef1), false);
  assertEquals(isAsyncFactoryDef(exDef2), false);

  function factoFunc() {}
  factoFunc.is = "asyncFactory" as const;

  type W = () => number;
  const factoDef = defineUnit(
    function (this: W) {
      return new Promise((res) => {
        res(() => this());
      });
    },
    { is: "asyncFactory" },
  );

  assertEquals(isAsyncFactoryDef(factoFunc), false);
  assertEquals(isAsyncFactoryDef(factoDef), true);
});

Deno.test("unit: isUnitDef", () => {
  const ex1 = 5;
  const ex2 = { a: 1, is: "asyncFactory" };
  const exDef1 = defineUnit(5);
  const exDef2 = defineUnit(function () {});

  assertEquals(isUnitDef(ex1), false);
  assertEquals(isUnitDef(ex2), false);
  assertEquals(isUnitDef(exDef1), true);
  assertEquals(isUnitDef(exDef2), true);

  function factoFunc() {}
  factoFunc.is = "asyncFactory" as const;

  type W = () => number;
  const factoDef = defineUnit(
    function (this: W) {
      return new Promise((res) => {
        res(() => this());
      });
    },
    { is: "asyncFactory" },
  );

  assertEquals(isUnitDef(factoFunc), false);
  assertEquals(isUnitDef(factoDef), true);
});
