import { assertEquals } from "@std/assert";

import * as userService from "./userService.ts";
import type { Database } from "../db.ts";
import { mockUnit } from "../../src/mock.ts";

Deno.test(function addUsertTest() {
  const db: Database = { users: [], posts: [] };
  const fakeBlocks = {
    "": {
      db,
    },
    ".": {
      getUserByEmail: (email: string) => {
        return db.users.find((user) => user.email === email);
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
