import { defineCircuit, wireUp } from "../../../src/wiremap.ts";

import { postCircuit } from "../circuits/post/postCircuit.ts";
import { userCircuit } from "../circuits/user/userCircuit.ts";

const circuit = defineCircuit({
  user: userCircuit,
  post: postCircuit,
});

export const app = wireUp(circuit);

const x = app("post.service").addPost;
