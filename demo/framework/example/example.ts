import type { InferWire } from "../../../src/wiremap.ts";
import {
  defineBlock,
  defineCircuit,
  defineUnit,
  wireUp,
} from "../../../src/wiremap.ts";

import { postCircuit } from "../circuits/post/postCircuit.ts";
import { userCircuit } from "../circuits/user/userCircuit.ts";

type W = InferWire<typeof circuit, "other">;

const circuit = defineCircuit(
  {
    user: userCircuit,
    post: postCircuit,
    other: defineBlock({
      something: defineUnit((w: W) => w("user.service").addUser, {
        is: "factory",
      }),
    }),
  },
  {},
);

export const app = wireUp(circuit);

export const { addPost } = app("post.service");
