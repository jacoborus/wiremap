import { type InferWire, tagBlock } from "../../../src/wiremap.ts";
import { type PostPlugin } from "./postPlugin.ts";

type W = InferWire<PostPlugin, "">;

export const $ = tagBlock();

export function addPost(
  this: W,
  email: string,
  content: string,
  published = false,
) {
  const author = this("#").getUserByEmail(email);
  if (!author) throw new Error("Author does not exists");

  if (published && !author.isAdmin) {
    throw new Error("Author does have permission to publish");
  }

  this("repo").data.push({
    id: crypto.randomUUID(),
    userId: author.id,
    content,
    published,
  });
}
addPost.is = "bound" as const;
