import { assertEquals } from "@std/assert";
import { isCircuit, defineCircuit } from "./circuit.ts";

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
