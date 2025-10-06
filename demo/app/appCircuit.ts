import { safename } from "safename";
import {
  circuit,
  defineBlock,
  defineInputs,
  type InferCircuitBlocks,
} from "../../src/wiremap.ts";

import * as postMod from "./post/postMod.ts";
import * as userMod from "./user/userMod.ts";

export const appCircuit = circuit(
  defineBlock({
    user: userMod,
    post: postMod,
  }),
  {
    inputs: defineInputs<{
      normalizeString: typeof safename;
    }>(),
  },
);

export type Blocks = InferCircuitBlocks<typeof appCircuit>;
