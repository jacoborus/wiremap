import { type InferWire, tagBlock } from "../../../src/wiremap.ts";
import type { PostCircuit } from "./postPlugin.ts";

type W = InferWire<PostCircuit, "">;

export const $ = tagBlock();

interface NewPost {
  email: string;
  content: string;
  title: string;
  slug: string;
  published?: boolean;
}

export function addPost(this: W, email: string, post: NewPost) {
  const author = this().getUserByEmail(email);

  if (!author) throw new Error("Author does not exists");

  if (post.published && !author.isAdmin) {
    throw new Error("Author does have permission to publish");
  }

  const newPost = Object.assign(
    {
      id: crypto.randomUUID(),
      userId: author.id,
      published: !!post.published,
    },
    post,
  );

  this("repo").data.push(newPost);
}
