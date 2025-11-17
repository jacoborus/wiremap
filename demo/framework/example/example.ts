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

const { addUser, getUsers } = app("user.service");
const postService = app("post.service");

printUsers();

addUser("asdf@example.com", false);

printUsers();

postService.addPost("asdf@example.com", {
  slug: "asdfasf",
  title: "Asdf Asdf",
  content: "Amazing",
});
// console.log("userdata:", app("user.repo").data);
// console.log("postData:", app("post.repo").data);

console.log("POSTS:\n", postService.listPosts());

function printUsers() {
  console.log("users:", getUsers());
}
