import { assertEquals } from "@std/assert";

import {
  defineBlock,
  extractUnits,
  getBlockUnitKeys,
  hasBlocks,
  isBlock,
  mapBlocks,
} from "./block.ts";
import { defineUnit } from "./unit.ts";

Deno.test("block: defineBlock", () => {
  const b1 = defineBlock({
    a: 1,
  });
  assertEquals(b1.$.__isBlock, true);
  assertEquals(b1.a, 1);
});

Deno.test("block: itemIsBlock", () => {
  const b1 = defineBlock({
    a: 1,
  });
  assertEquals(isBlock(b1), true);
  assertEquals(isBlock({ $: 2 }), false);
});

Deno.test("block: getBlockUnitKeys", () => {
  // just public keys
  const myBlock = defineBlock({
    a: 1,
    b: defineBlock({
      c: 1,
    }),
    e: () => 5,
    f: 5,
  });

  assertEquals(getBlockUnitKeys(myBlock, true), ["a", "e", "f"]);
  assertEquals(getBlockUnitKeys(myBlock.b, true), ["c"]);

  function e() {
    return 5;
  }
  e.isPrivate = true as const;
  // with private keys
  const myBlock2 = defineBlock({
    a: 1,
    b: defineBlock({
      c: 1,
    }),
    e,
    f: defineUnit(5, { isPrivate: true }),
  });

  assertEquals(getBlockUnitKeys(myBlock2, false), ["a"]);
  assertEquals(getBlockUnitKeys(myBlock2.b, false), ["c"]);
});

Deno.test("block: createBlockProxy", () => {});

Deno.test("block: itemIsBlock", () => {
  assertEquals(isBlock("asdf"), false);
  assertEquals(isBlock(1), false);
  assertEquals(isBlock(true), false);
  assertEquals(isBlock(null), false);
  assertEquals(isBlock({}), false);

  assertEquals(isBlock({ a: 1 }), false);
  assertEquals(isBlock({ $a: 1 }), false);
  assertEquals(isBlock({ $: 1 }), false);
  assertEquals(isBlock({ $: { a: true } }), false);

  assertEquals(isBlock({ $: { __isBlock: false } }), false);
  assertEquals(isBlock({ $: { __isBlock: true } }), true);
});

Deno.test("block: extractUnits", () => {
  assertEquals(extractUnits({ a: 1, b: "asdf" }), { a: 1, b: "asdf" });
  assertEquals(extractUnits({ a: 1, $: "asfd" }), { a: 1 });
  assertEquals(extractUnits({ a: 1, $: { __isBlock: true } }), { a: 1 });
});

Deno.test("block: hasBlocks", () => {
  assertEquals(hasBlocks({ a: 1, b: "asdf" }), false);
  assertEquals(hasBlocks({ a: 1, $: "asfd" }), false);
  assertEquals(hasBlocks({ a: 1, $: { __isBlock: true } }), false);
  assertEquals(hasBlocks({ a: 1, $b: { b: 2 } }), true);
  assertEquals(hasBlocks({ a: 1, b: { $: { __isBlock: true } } }), true);
});

Deno.test("block: mapBlocks", () => {
  const origin = {
    $uno: {
      a: 3,
      b: "asdf",
      $sub: {
        otro: 2,
      },
      $otro: 5,
    },
  };
  assertEquals(mapBlocks(origin), {
    uno: { a: 3, b: "asdf" },
    "uno.sub": { otro: 2 },
  });
});
