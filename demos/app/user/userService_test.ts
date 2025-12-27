import { assertEquals } from "@std/assert";

import { mockUnit } from "wiremap";

import type { User } from "./userRepo.ts";
import * as userService from "./userService.ts";

Deno.test("addUsertTest", function addUsertTest() {
  const repo = [] as User[];
  const fakeBlocks = {
    user: { repo },
    ".": {
      getUserByEmail: (email: string) => {
        return repo.find((user) => user.email === email);
      },
    },
  };

  const getUsers = mockUnit(userService.getUsers, fakeBlocks);
  const addUser = mockUnit(userService.addUser, fakeBlocks);

  let users = getUsers();
  assertEquals(users.length, 0);

  addUser("john", "john@example.com", true);

  users = getUsers();
  assertEquals(users.length, 1);
});
