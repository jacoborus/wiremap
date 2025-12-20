import { type InferWire, tagBlock } from "../../../../src/wiremap.ts";
import type { PostCircuit } from "./postCircuit.ts";

type W = InferWire<PostCircuit, "service">;

export const $ = tagBlock();

interface NewPost {
  content: string;
  title: string;
  slug: string;
  published?: boolean;
}

export function addPost(this: W, email: string, post: NewPost) {
  const author = this("userService").getUserByEmail(email);

  if (!author) throw new Error("Author does not exists");

  if (post.published && !author.isAdmin) {
    throw new Error("Author does have permission to publish");
  }

  const newPost = Object.assign(post, {
    id: crypto.randomUUID(),
    userId: author.id,
    published: !!post.published,
  });

  this("repo").data.push(newPost);
}
addPost.is = "bound" as const;

export function listPosts(this: W) {
  return this("repo").data.slice();
}
listPosts.is = "bound" as const;
