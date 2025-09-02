import * as postMod from "./post/postMod.ts";
import * as userMod from "./user/userMod.ts";
import {
  wireUp,
  type InferBlocks,
  type ExtractModulePaths,
} from "../src/wiremap.ts";

const appSchema = {
  /** The User module */
  user: userMod,
  /** The Post module */
  post: postMod,
};

export type Blocks = InferBlocks<typeof appSchema>;
type X = ExtractModulePaths<"post.service", Blocks>;

export const app = await wireUp(appSchema);

const userId = app("user.service").addUser(
  "jacobo",
  "jacobo@example.com",
  true,
);

const postService = app("post.service");
const addPost = postService.addPost;

addPost("Hello World!", "This is a test", userId);
addPost("Hola Mundo!", "Esto es una prueba", userId);

console.log(app("post").childResolution());
