import {
  defineInputs,
  defineCircuit,
  type InferCircuitBlocks,
} from "../../../src/wiremap.ts";
import type { Framework } from "../core/core.ts";

import * as postMod from "./postMod.ts";

export const postPlugin = defineCircuit(postMod, {
  inputs: defineInputs<{
    getUser: Framework["user.service"]["getUserByEmail"];
    userService: Framework["user.service"];
  }>(),
});

export type PostCircuit = InferCircuitBlocks<typeof postPlugin>;
