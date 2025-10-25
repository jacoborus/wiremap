import type { safename } from "safename";
import { defineCircuit, defineInputs } from "../../src/wiremap.ts";

import * as postMod from "./post/postMod.ts";
import * as userMod from "./user/userMod.ts";

export const appCircuit = defineCircuit(
  {
    hola: "hi!",
    user: userMod,
    post: postMod,
  },
  {
    inputs: defineInputs<{
      normalizeString: typeof safename;
    }>(),
  },
);

export type Circuit = typeof appCircuit;
