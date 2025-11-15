import { assertEquals } from "@std/assert";
import { isCircuit, defineCircuit, extractCircuitPaths } from "./circuit.ts";

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
});

Deno.test("block: extactCircuitPaths", () => {
  assertEquals(
    extractCircuitPaths({
      a: 1,
      $b: { a: 1 },
      c: { a: 1, $: { __isBlock: true } },
    }),
    [],
  );

  assertEquals(
    extractCircuitPaths({
      a: 1,
      $b: { a: 1 },
      c: { a: 1, $: { __isBlock: true } },
      circ: {
        __isCircuit: true,
        __hub: {},
        __inputs: {},
        __circuitPaths: [],
      },
      $other: {
        __isCircuit: true,
        __hub: {},
        __inputs: {},
        __circuitPaths: [],
      },
    }),
    ["circ", "other"],
  );

  assertEquals(
    extractCircuitPaths({
      a: 1,
      $b: { a: 1 },
      $good: {
        a: 1,
        $: {
          __isBlock: true,
        },
        circ: {
          __isCircuit: true,
          __hub: {
            $other: {
              __isCircuit: true,
              __hub: {},
              __inputs: {},
              __circuitPaths: [],
            },
          },
          __inputs: {},
          __circuitPaths: ["other"],
        },
      },
    }),
    ["good.circ", "good.circ.other"],
  );
});
