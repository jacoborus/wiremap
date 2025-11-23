import { assertEquals } from "@std/assert";

import { plug } from "../src/plug.ts";

Deno.test("plug", () => {
  const circuit = {
    __isCircuit: true,
    __hub: {},
    __inputs: {},
    __circuitPaths: [],
  };
  assertEquals(plug(circuit, {}), {
    __isPlugin: true,
    __circuit: circuit,
    __connector: {},
  });
});

Deno.test("plug", () => {
  const circuit = {
    __isCircuit: true,
    __hub: {},
    __inputs: {} as {
      algo: {
        a: number;
        b: string;
      };
    },
    __circuitPaths: [],
  };
  assertEquals(
    plug(circuit, {
      algo: { asf: "asdf" },
    }),
    {
      __isPlugin: true,
      __circuit: circuit,
      __connector: {
        algo: { asf: "asdf" },
      },
    },
  );
});
