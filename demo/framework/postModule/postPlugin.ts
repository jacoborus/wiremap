import { definePlugin, type InferPlugin } from "../../../src/wiremap.ts";
import { type Framework } from "../core/core.ts";

import * as postMod from "./postMod.ts";

export const postPlugin = definePlugin<{
  getUser: Framework["user.service"]["getUserByEmail"];
  userService: Framework["user.service"];
}>({
  plugin: postMod,
  deps: {
    getUserByEmail: "unit",
    userService: "block",
  },
});

export type PostPlugin = InferPlugin<typeof postPlugin>;
