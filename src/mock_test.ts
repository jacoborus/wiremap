import { assertEquals } from "@std/assert";

import { mockUnit } from "./mock.ts";

Deno.test("mockUnit: bound", () => {
  function boundFunc(id: string) {
    const getUser = this("user.service").getUser;
    return getUser(id);
  }
  boundFunc.isBound = true as const;

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

Deno.test("mockUnit: factory", () => {
  function factoryFunc(
    wire: <K extends keyof typeof fakeBlocks>(k: K) => (typeof fakeBlocks)[K],
  ) {
    return function (id: string) {
      const getUser = wire("user.service").getUser;
      return getUser(id);
    };
  }
  factoryFunc.isFactory = true as const;

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

Deno.test("mockUnit: async factory", async () => {
  async function factoryFunc(
    wire: <K extends keyof typeof fakeBlocks>(k: K) => (typeof fakeBlocks)[K],
  ) {
    await new Promise((res) => res(true));

    return function (id: string) {
      const getUser = wire("user.service").getUser;
      return getUser(id);
    };
  }
  factoryFunc.isFactory = true as const;
  factoryFunc.isAsyncFactory = true as const;

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
