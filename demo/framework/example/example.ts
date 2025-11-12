import {
  defineBlock,
  defineCircuit,
  defineUnit,
  InferWire,
  wireUp,
} from "../../../src/wiremap.ts";

import { postCircuit } from "../circuits/post/postCircuit.ts";
import { userCircuit } from "../circuits/user/userCircuit.ts";

type W = InferWire<typeof circuit, "other">;

const circuit = defineCircuit(
  {
    post: postCircuit,
    user: userCircuit,
    other: defineBlock({
      something: defineUnit((w: W) => w("user.service").addUser, {
        is: "factory",
      }),
    }),
  },
  {},
);

// const def = {
//   // user: userCircuit,
//   post: postCircuit,
// };
// type II = InputsFromHub<typeof def>;
// type Mappp = MappedHub<typeof def>;
// type Inputsss = ExtractCircuits<typeof def>;
// type sdfa = II["user.service"];
// type tes = Inputsss["__inputs"];
// type tasdfes = (typeof postCircuit)["__inputs"]["user.service"];
// type DD = GetFlatDiff<
//   (typeof postCircuit)["__inputs"],
//   (typeof userCircuit)["__inputs"]
// >;

export const app = wireUp(circuit);

export const { addPost } = app("post.service");
