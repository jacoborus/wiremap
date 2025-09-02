import { assertEquals, assertThrows } from "@std/assert";
import { tagBlock, wireUp, defineUnit } from "./wiremap.ts";
import { mockUnit } from "./mock.ts";
import type { InferBlocks, InferWire } from "./wiremap.ts";

Deno.test("wireUp resolves dependencies", () => {
  const defs = {
    key: "value",
    nested: {
      $: tagBlock(),
      subKey: "subValue",
      subKey2: "subValue2",
    },
  };

  const app = wireUp(defs);

  const keys = Object.keys(app());
  assertEquals(keys.length, 1, "block proxies are ennumerable");

  const nestedKeys = Object.keys(app("nested"));
  assertEquals(nestedKeys.length, 2, "nested block proxies are ennumerable");

  assertEquals(app().key, "value");
  assertEquals(app("nested").subKey, "subValue");
  assertEquals(app("nested").subKey2, "subValue2");
});

Deno.test("wireUp resolves async factories that return a promise", async () => {
  const $ = tagBlock();
  type W = InferWire<InferBlocks<Defs>, "">;

  function factoryFn(w: W) {
    const theKey = w().keyName;
    return new Promise((resolve) => {
      resolve(theKey);
    });
  }
  factoryFn.isFactory = true as const;
  factoryFn.isAsync = true as const;

  const defs = {
    $,
    keyName: "value",
    factoryFn,
    nested: {
      $: tagBlock(),
      subKey: "subValue",
    },
  };
  type Defs = typeof defs;

  const app = await wireUp(defs);

  assertEquals(app().keyName, "value");
  assertEquals(app("nested").subKey, "subValue");
  assertEquals(app().factoryFn, "value");
});

Deno.test("block creates namespaced definitions", () => {
  const blockInstance = {
    $: tagBlock(),
    key: 5,
    key2: 6,
  };

  const blockParent = {
    $: tagBlock(),
    namespace: blockInstance,
  };

  const mainWire = wireUp({ parent: blockParent });

  assertEquals(mainWire("parent.namespace").key, 5);
  assertEquals(mainWire("parent.namespace").key2, 6);
});

Deno.test("error handling for missing dependencies", () => {
  const defs = {
    $: tagBlock(),
    key: "value",
  };

  const app = wireUp(defs);

  try {
    try {
      try {
        app("nonexistent" as ".");
        throw new Error("Should have thrown an error");
      } catch (e: unknown) {
        if (e instanceof Error) {
          assertEquals(e.message, 'Unit nonexistent not found from block ""');
        }
      }
    } catch (e) {
      assertEquals(
        (e as Error).message,
        'Key nonexistent not found from block ""',
      );
    }
  } catch (error) {
    if (error instanceof Error) {
      assertEquals(error.message, 'Key nonexistent not found from block ""');
    }
  }
});

Deno.test("mock injection", () => {
  const fakeBlocks = {
    "test.service": {
      getByEmail: (email: string) => {
        assertEquals(email, "email");
        return { email };
      },
    },
  };

  type W = <K extends keyof typeof fakeBlocks>(k: K) => (typeof fakeBlocks)[K];

  function bound(this: W, email: string) {
    // const getByEmail = injector(".").getByEmail;
    const getByEmail = this("test.service").getByEmail;
    return getByEmail(email);
  }
  bound.isBound = true as const;

  const getUser = mockUnit(bound, fakeBlocks);

  assertEquals(getUser("email").email, "email");
});

Deno.test("mockFactory", () => {
  const fakeBlocks = {
    "@test.service": {
      getByEmail: (email: string) => {
        assertEquals(email, "email");
        return { email };
      },
    },
  };

  type W = <K extends keyof typeof fakeBlocks>(k: K) => (typeof fakeBlocks)[K];

  function getUserFactory(w: W) {
    const getByEmail = w("@test.service").getByEmail;
    return (email: string) => getByEmail(email);
  }
  getUserFactory.isFactory = true as const;

  const getUser = mockUnit(getUserFactory, fakeBlocks);

  assertEquals(getUser("email").email, "email");
});

Deno.test("wireUp protects private units", () => {
  type Wa = InferWire<Defs, "A">;
  type Wb = InferWire<Defs, "B">;

  function priv() {
    return "private";
  }
  priv.isPrivate = true as const;

  function pub(this: Wa) {
    const f = this(".").priv;
    return f();
  }
  pub.isBound = true as const;

  function other(this: Wb) {
    // @ts-ignore: this is just for the internal test
    const f = this("A").priv;
    // @ts-ignore: this is just for the internal test
    return f();
  }

  const defs = {
    A: {
      $: tagBlock(),
      priv,
      pub,
    },
    B: {
      $: tagBlock(),
      other,
    },
  };
  type Defs = InferBlocks<typeof defs>;

  const main = wireUp(defs);

  assertThrows(
    // @ts-ignore: this is just for the internal test
    () => main("A").priv(),
    "Private props are not accesible from other block injector",
  );
  assertEquals(
    main("A").pub(),
    "private",
    "Private props are accesible from other units of same block",
  );

  // @ts-ignore: this is just for the internal test
  assertThrows(() => main("B").other());

  let passedFromRootInjector = false;

  try {
    // @ts-ignore: it's just for the internal test
    main("A").priv;
    passedFromRootInjector = true;
  } catch (e: unknown) {
    if (e instanceof Error) {
      assertEquals(e.message, `Block 'A' has no unit named 'priv'`);
    }
  }

  assertEquals(
    passedFromRootInjector,
    false,
    "Private units should not be accessible from root injector",
  );
});

Deno.test("defineUnit: no options", () => {
  const block = {
    $: tagBlock(),
    valor: defineUnit(5),
    o: {
      $: tagBlock(),
      /**  A value */
      valor: defineUnit("hola"),
    },
  };
  const main = wireUp(block);
  assertEquals(main().valor, 5);
  assertEquals(main("o").valor, "hola");
});

Deno.test("defineUnit: isPrivate", () => {
  const $ = tagBlock();
  const $a = tagBlock();
  const $b = tagBlock();
  type Wb = InferWire<Defs, "b">;

  const block = {
    $,
    valor: defineUnit(5),
    o: 5,
    a: {
      $: $a,
      valor: defineUnit("hola"),
      o: 5,
    },
    b: {
      $: $b,
      valor: defineUnit("hola", { isPrivate: true }),
      refer: defineUnit(
        function (w: Wb) {
          return w(".").valor;
        },
        { isFactory: true },
      ),
    },
  };

  type Defs = InferBlocks<typeof block>;
  const main = wireUp(block);

  assertEquals(main().valor, 5);
  assertEquals(main("a").valor, "hola");
  assertThrows(() => {
    // @ts-ignore: this is just for the internal test
    main("b").valor;
  });
  assertEquals(main("b").refer, "hola");
});

Deno.test("defineUnit: isFactory", () => {
  const $ = tagBlock();
  const $a = tagBlock();
  const $b = tagBlock();

  type Wa = InferWire<Defs, "a">;
  type Wb = InferWire<Defs, "a.b">;

  const defs = {
    $,
    valor: "rootvalue",
    a: {
      $: $a,
      valor: "avalue",
      factory: defineUnit(
        (w: Wa) => {
          const rootValue = w().valor;
          const avalue = w(".").valor;
          const bvalue = w("a.b").valor;
          return () => `${rootValue}-${avalue}-${bvalue}`;
        },
        { isFactory: true },
      ),
      b: {
        $: $b,
        valor: "bvalue",
        deepFactory: defineUnit(
          (w: Wb) => {
            const rootValue = w().valor;
            const avalue = w("a").valor;
            const bvalue = w(".").valor;
            return () => `${rootValue}-${avalue}-${bvalue}`;
          },
          { isFactory: true },
        ),
        deepFactory2: defineUnit(
          (w: Wb) => {
            return w(".").deepFactory;
          },
          { isFactory: true },
        ),
      },
    },
  };
  type Defs = InferBlocks<typeof defs>;

  const main = wireUp(defs);

  assertEquals(main().valor, "rootvalue");
  assertEquals(main("a").valor, "avalue");
  assertEquals(main("a").factory(), "rootvalue-avalue-bvalue");
  assertEquals(main("a.b").deepFactory(), "rootvalue-avalue-bvalue");
  assertEquals(main("a.b").deepFactory2(), "rootvalue-avalue-bvalue");
});

Deno.test("defineUnit: isAsync", async () => {
  const $ = tagBlock();
  const $a = tagBlock();
  const $b = tagBlock();

  type Wa = InferWire<Defs, "a">;
  type Wb = InferWire<Defs, "a.b">;

  const defs = {
    $,
    valor: "rootvalue",
    a: {
      $: $a,
      valor: "avalue",
      factory: defineUnit(
        async (w: Wa) => {
          const rootValue = w().valor;
          const avalue = w(".").valor;
          const bvalue = w("a.b").valor;
          await new Promise((res) => {
            res(true);
          });
          return () => `${rootValue}-${avalue}-${bvalue}`;
        },
        { isFactory: true, isAsync: true },
      ),
      b: {
        $: $b,
        valor: "bvalue",
        deepFactory: defineUnit(
          async (w: Wb) => {
            const rootValue = w().valor;
            const avalue = w("a").valor;
            const bvalue = w(".").valor;
            return await new Promise<() => string>((res) => {
              setTimeout(
                () => res(() => `${rootValue}-${avalue}-${bvalue}`),
                10,
              );
            });
          },
          { isFactory: true, isAsync: true },
        ),
        deepFactory2: defineUnit(
          async (w: Wb) => {
            return await new Promise<() => string>((res) => {
              setTimeout(() => res(w(".").deepFactory), 20);
            });
          },
          { isFactory: true, isAsync: true },
        ),
      },
    },
  };

  type Defs = InferBlocks<typeof defs>;
  const main = await wireUp(defs);

  assertEquals(main().valor, "rootvalue");
  assertEquals(main("a").valor, "avalue");
  assertEquals(main("a").factory(), "rootvalue-avalue-bvalue");
  assertEquals(main("a.b").deepFactory(), "rootvalue-avalue-bvalue");
  assertEquals(main("a.b").deepFactory2(), "rootvalue-avalue-bvalue");
});
