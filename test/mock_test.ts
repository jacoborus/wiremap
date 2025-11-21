import { assertEquals } from "@std/assert";

import { mockUnit } from "../src/mock.ts";
import { defineUnit } from "../src/unit.ts";

Deno.test("mockUnit: bound function", () => {
  type W = <K extends keyof typeof fakeBlocks>(k: K) => (typeof fakeBlocks)[K];
  function boundFunc(this: W, id: string) {
    const getUser = this("user.service").getUser;
    return getUser(id);
  }
  boundFunc.is = "bound" as const;

  const fakeBlocks = {
    "user.service": {
      getUser: (id: string) => ({
        id,
        name: "jacobo",
        email: "asdfasdf@asdfasdf.asdf",
        isAdmin: true,
      }),
    },
  };

  const bound = mockUnit(boundFunc, fakeBlocks);
  const user = bound("11234");

  if (!user) throw new Error("User not found");

  assertEquals(user, {
    id: "11234",
    name: "jacobo",
    email: "asdfasdf@asdfasdf.asdf",
    isAdmin: true,
  });
});

Deno.test("mockUnit: factory function", () => {
  function factoryFunc(
    wire: <K extends keyof typeof fakeBlocks>(k: K) => (typeof fakeBlocks)[K],
  ) {
    return function (id: string) {
      const getUser = wire("user.service").getUser;
      return getUser(id);
    };
  }
  factoryFunc.is = "factory" as const;

  const fakeBlocks = {
    "user.service": {
      getUser: (id: string) => ({
        id,
        name: "jacobo",
        email: "asdfasdf@asdfasdf.asdf",
        isAdmin: true,
      }),
    },
  };

  const factory = mockUnit(factoryFunc, fakeBlocks);
  const user = factory("11234");

  if (!user) throw new Error("User not found");

  assertEquals(user, {
    id: "11234",
    name: "jacobo",
    email: "asdfasdf@asdfasdf.asdf",
    isAdmin: true,
  });
});

Deno.test("mockUnit: async factory function", async () => {
  async function factoryFunc(
    wire: <K extends keyof typeof fakeBlocks>(k: K) => (typeof fakeBlocks)[K],
  ) {
    await new Promise((res) => res(true));

    return function (id: string) {
      const getUser = wire("user.service").getUser;
      return getUser(id);
    };
  }
  factoryFunc.is = "asyncFactory" as const;

  const fakeBlocks = {
    "user.service": {
      getUser: (id: string) => ({
        id,
        name: "jacobo",
        email: "asdfasdf@asdfasdf.asdf",
        isAdmin: true,
      }),
    },
  };

  const factory = await mockUnit(factoryFunc, fakeBlocks);
  const user = factory("11234");

  if (!user) throw new Error("User not found");

  assertEquals(user, {
    id: "11234",
    name: "jacobo",
    email: "asdfasdf@asdfasdf.asdf",
    isAdmin: true,
  });
});

Deno.test("mockUnit: bound definition", () => {
  type W = <K extends keyof typeof fakeBlocks>(k: K) => (typeof fakeBlocks)[K];
  const boundDef = defineUnit(
    function (this: W, id: string) {
      const getUser = this("user.service").getUser;
      return getUser(id);
    },
    { is: "bound" },
  );

  const fakeBlocks = {
    "user.service": {
      getUser: (id: string) => ({
        id,
        name: "jacobo",
        email: "asdfasdf@asdfasdf.asdf",
        isAdmin: true,
      }),
    },
  };

  const fn = mockUnit(boundDef, fakeBlocks);
  const user = fn("11234");

  if (!user) throw new Error("User not found");

  assertEquals(user, {
    id: "11234",
    name: "jacobo",
    email: "asdfasdf@asdfasdf.asdf",
    isAdmin: true,
  });
});

Deno.test("mockUnit: factory definition", () => {
  type W = <K extends keyof typeof fakeBlocks>(k: K) => (typeof fakeBlocks)[K];
  const factoryDef = defineUnit(
    function (w: W) {
      return (id: string) => {
        const getUser = w("user.service").getUser;
        return getUser(id);
      };
    },
    { is: "factory" },
  );

  const fakeBlocks = {
    "user.service": {
      getUser: (id: string) => ({
        id,
        name: "jacobo",
        email: "asdfasdf@asdfasdf.asdf",
        isAdmin: true,
      }),
    },
  };

  const fn = mockUnit(factoryDef, fakeBlocks);
  const user = fn("11234");

  if (!user) throw new Error("User not found");

  assertEquals(user, {
    id: "11234",
    name: "jacobo",
    email: "asdfasdf@asdfasdf.asdf",
    isAdmin: true,
  });
});

Deno.test("mockUnit: async factory definition", async () => {
  type W = <K extends keyof typeof fakeBlocks>(k: K) => (typeof fakeBlocks)[K];
  const asyncFactory = defineUnit(
    async function (w: W) {
      await new Promise((res) => res(true));

      return (id: string) => {
        const getUser = w("user.service").getUser;
        return getUser(id);
      };
    },
    { is: "asyncFactory" },
  );

  const fakeBlocks = {
    "user.service": {
      getUser: (id: string) => ({
        id,
        name: "jacobo",
        email: "asdfasdf@asdfasdf.asdf",
        isAdmin: true,
      }),
    },
  };

  const fn = await mockUnit(asyncFactory, fakeBlocks);
  const user = fn("11234");

  if (!user) throw new Error("User not found");

  assertEquals(user, {
    id: "11234",
    name: "jacobo",
    email: "asdfasdf@asdfasdf.asdf",
    isAdmin: true,
  });
});
