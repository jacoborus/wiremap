import { defineCircuit } from "../../../src/circuit.ts";
import { wireUp } from "../../../src/wiremap.ts";

import { coreDefs } from "../core/core.ts";
import { postCircuit } from "../postModule/postCircuit.ts";

const defs = defineCircuit({
  ...coreDefs,
  post: postCircuit,
});

const app = wireUp(defs);
