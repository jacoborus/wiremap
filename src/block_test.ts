import { assertEquals } from "@std/assert";

import {
  defineBlock,
  extractUnits,
  getBlockUnitKeys,
  itemIsBlock,
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

Deno.test("block: createBlockProxy", () => {});

Deno.test("block: itemIsBlock", () => {
  assertEquals(itemIsBlock("asdf"), false);
  assertEquals(itemIsBlock(1), false);
  assertEquals(itemIsBlock(true), false);
  assertEquals(itemIsBlock(null), false);
  assertEquals(itemIsBlock({}), false);

  assertEquals(itemIsBlock({ a: 1 }), false);
  assertEquals(itemIsBlock({ $a: 1 }), false);
  assertEquals(itemIsBlock({ $: 1 }), false);
  assertEquals(itemIsBlock({ $: { a: true } }), false);

  assertEquals(itemIsBlock({ $: { __isBlock: false } }), false);
  assertEquals(itemIsBlock({ $: { __isBlock: true } }), true);
});

Deno.test("block: extractUnits", () => {
  assertEquals(extractUnits({ a: 1, b: "asdf" }), { a: 1, b: "asdf" });
  assertEquals(extractUnits({ a: 1, $: "asfd" }), { a: 1 });
  assertEquals(extractUnits({ a: 1, $: { __isBlock: true } }), { a: 1 });
});
