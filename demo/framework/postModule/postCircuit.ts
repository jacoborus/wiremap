import { defineInputs, defineCircuit } from "../../../src/wiremap.ts";
import type { FWCore } from "../core/core.ts";

import * as postMod from "./postMod.ts";

export const postCircuit = defineCircuit(postMod, {
  inputs: defineInputs<{
    "$>": {
      getUser: FWCore["user.service"]["getUserByEmail"];
    };
    $userService: FWCore["user.service"];
  }>(),
});

export type PostCircuit = typeof postCircuit;
