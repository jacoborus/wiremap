import type { InferCircuitBlocks } from "../../../src/wiremap.ts";
import { defineCircuit } from "../../../src/wiremap.ts";

import * as userMod from "./user/userMod.ts";

const configBase = {
  port: 3000,
  host: "localhost",
};

export const coreDefs = defineCircuit({
  configBase,
  user: userMod,
  hola: "hola",
});

export type Framework = InferCircuitBlocks<typeof coreDefs>;
