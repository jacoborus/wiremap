import { assertEquals, assertThrows } from "@std/assert";

import { blockSymbol } from "./common.ts";
import { defineBlock, itemIsBlock } from "./block.ts";

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
