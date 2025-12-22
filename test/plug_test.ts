import { assertEquals } from "@std/assert";

import { plug, isPlugin } from "../src/plug.ts";

Deno.test("plug", () => {
  const circuit = {
    __isCircuit: true,
    __hub: {},
    __inputs: {},
    __pluginAdapters: new Map(),
  };
  assertEquals(plug(circuit, {}), {
    __isPlugin: true,
    __circuit: circuit,
    __adapter: {},
    __inputs: {},
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
    __pluginAdapters: new Map(),
  };
  assertEquals(
    plug(circuit, {
      algo: { asf: "asdf" },
    }),
    {
      __isPlugin: true,
      __circuit: circuit,
      __adapter: {
        algo: { asf: "asdf" },
      },
      __inputs: {},
    },
  );
});

Deno.test("isPlugin", () => {
  const circuit = {
    __isCircuit: true,
    __hub: {},
    __inputs: {} as {
      algo: {
        a: number;
        b: string;
      };
    },
    __pluginAdapters: new Map(),
  };
  assertEquals(
    isPlugin(
      plug(circuit, {
        algo: { asf: "asdf" },
      }),
    ),
    true,
  );

  assertEquals(
    isPlugin({
      __isPlugin: true,
      __adapter: {},
      __circuit: {
        __isCircuit: true,
        __hub: {},
        __inputs: {},
        __pluginAdapters: new Map(),
      },
    }),
    true,
  );
});
