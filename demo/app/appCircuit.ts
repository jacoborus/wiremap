import type { safename } from "safename";
import { circuit, defineInputs, type InferCircuit } from "../../src/wiremap.ts";

import * as postMod from "./post/postMod.ts";
import * as userMod from "./user/userMod.ts";

export const appCircuit = circuit(
  {
    hola: 5,
    user: userMod,
    post: postMod,
  },
  {
    inputs: defineInputs<{
      normalizeString: typeof safename;
    }>(),
  },
);

export type Blocks = InferCircuit<typeof appCircuit>;
