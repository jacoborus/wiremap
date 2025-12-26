import { wireUp } from "../../src/wiremap.ts";
import { safename } from "safename";

import { appCircuit } from "./appCircuit.ts";

export const app = await wireUp(appCircuit, {
  "tools.text": {
    normalizeString: safename,
  },
});

const userId = app("user.service").addUser(
  "john",
  "john@example.com",
  true,
);

console.log(app().hola);
console.log("1 ===", app("dollar").a);

const postService = app("post.service");
const addPost = postService.addPost;

addPost("Hello World!", "This is a test", userId);
addPost("Hola Mundo!", "Esto es una prueba", userId);

console.log(app("post.service").getPosts());
