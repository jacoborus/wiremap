import { defineCircuit, wireUp } from "../../../src/wiremap.ts";

import { coreDefs } from "../core/core.ts";
import { postCircuit } from "../postModule/postCircuit.ts";

const defs = defineCircuit({
  core: coreDefs,
  post: postCircuit,
});

const app = wireUp(defs);
