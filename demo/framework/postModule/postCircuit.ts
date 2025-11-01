import { defineInputs, defineCircuit } from "../../../src/wiremap.ts";
import type { Framework } from "../core/core.ts";
import type { InferUnitValue } from "../../../src/unit.ts";

import * as postMod from "./postMod.ts";
import { InferBlockValue } from "../../../src/block.ts";

export const postCircuit = defineCircuit(postMod, {
  inputs: defineInputs<{
    "$>": {
      getUser: Framework["__hub"]["user.service"]["getUserByEmail"];
    };
    $userService: InferBlockValue<Framework["__hub"]["user.service"]>;
  }>(),
});

export type PostCircuit = typeof postCircuit;
