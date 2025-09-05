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
        email: "asdfasdf@qfasdfasd.asdf",
        isAdmin: true,
      }),
    },
  };

  const bound = mockUnit(boundFunc, fakeBlocks);
  const user = bound("11234");

  if (!user) throw new Error("Post not found");

  assertEquals(user, {
    id: "11234",
    name: "jacobo",
    email: "asdfasdf@qfasdfasd.asdf",
    isAdmin: true,
  });
});
