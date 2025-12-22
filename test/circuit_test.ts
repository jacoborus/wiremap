import { assertEquals } from "@std/assert";

import {
  isCircuit,
  defineCircuit,
  extractPluginAdapters,
} from "../src/circuit.ts";

Deno.test("block: isCircuit", () => {
  assertEquals(
    isCircuit({
      $uno: {
        a: 3,
        b: "asdf",
        $sub: {
          otro: 2,
        },
        $otro: 5,
      },
    }),
    false,
  );

  assertEquals(
    isCircuit({
      __hub: {},
    }),
    false,
  );

  assertEquals(
    isCircuit({
      __isCircuit: true,
      __hub: {},
    }),
    false,
  );

  assertEquals(
    isCircuit({
      __isCircuit: true,
      __inputs: 4,
      __hub: {},
    }),
    false,
  );

  assertEquals(
    isCircuit({
      __isCircuit: true,
      __inputs: {},
      __hub: 4,
    }),
    false,
    "wrong __inputs",
  );

  assertEquals(
    isCircuit({
      __isCircuit: {},
      __inputs: {},
      __hub: {},
    }),
    false,
    "wrong __isCircuit",
  );

  assertEquals(
    isCircuit({
      __isCircuit: true,
      __inputs: {},
      __hub: {},
    }),
    true,
  );

  // integration test (defineCircuit)
  assertEquals(
    isCircuit(
      defineCircuit(
        {
          hola: 1,
        },
        {},
      ),
    ),
    true,
  );

  assertEquals(
    isCircuit({
      __isCircuit: true,
      __hub: {
        "aBlock.bBlock": {
          c: 1,
          d: "d",
        },
      },
      __inputs: { asdf: 4 },
    }),
    true,
  );
});

Deno.test("block: extactPluginAdapters", () => {
  assertEquals(
    extractPluginAdapters({
      a: 1,
      $b: { a: 1 },
      c: { a: 1, $: { __isBlock: true } },
    }),
    new Map(),
  );

  assertEquals(
    extractPluginAdapters({
      a: 1,
      $b: { a: 1 },
      c: { a: 1, $: { __isBlock: true } },
      thePlugin: {
        __isPlugin: true,
        __connector: {},
        __adapter: {},
        __circuit: {
          __isCircuit: true,
          __hub: {},
          __inputs: {},
          __pluginAdapters: new Map(),
        },
      },
      $other: {
        __isPlugin: true,
        __connector: {},
        __adapter: {},
        __circuit: {
          __isCircuit: true,
          __hub: {},
          __inputs: {},
          __pluginAdapters: new Map(),
        },
      },
    }),
    new Map([
      ["thePlugin", {}],
      ["other", {}],
    ]),
  );

  assertEquals(
    extractPluginAdapters({
      a: 1,
      $b: { a: 1 },
      $good: {
        a: 1,
        $: {
          __isBlock: true,
        },
        circ: {
          __isPlugin: true,
          __adapter: {},
          __circuit: {
            __isCircuit: true,
            __inputs: {},
            __pluginAdapters: new Map([["other", {}]]),
            __hub: {
              $other: {
                __isCircuit: true,
                __hub: {},
                __inputs: {},
                __pluginAdapters: new Map(),
              },
            },
          },
        },
      },
    }),
    new Map([
      ["good.circ", {}],
      ["good.circ.other", {}],
    ]),
  );
});
