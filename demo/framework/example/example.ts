import { type InferCircuitBlocks, plug, wireUp } from "../../../src/wiremap.ts";

import { coreDefs, type Framework } from "../core/core.ts";
import { postPlugin } from "../postModule/postPlugin.ts";

const defs = {
  ...coreDefs,
  post: plug(postPlugin, {
    getUser: ["user.service", "getUser"],
    userService: ["user.service"],
  }),
};

const app = wireUp(defs);
