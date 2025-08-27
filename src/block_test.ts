import { assertEquals, assertThrows } from "@std/assert";

import { blockSymbol } from "./common.ts";
import { defineBlock, getBlockUnitKeys, itemIsBlock } from "./block.ts";
import { defineUnit } from "./unit.ts";

Deno.test("block: defineBlock", () => {
  const b1 = defineBlock({
    a: 1,
  });
  assertEquals(b1.$, blockSymbol);
  assertEquals(b1.a, 1);
});

Deno.test("block: itemIsBlock", () => {
  const b1 = defineBlock({
    a: 1,
  });
  assertEquals(itemIsBlock(b1), true);
  assertEquals(itemIsBlock({ $: 2 }), false);
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
