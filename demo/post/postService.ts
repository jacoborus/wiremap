import { tagBlock, type InferWire } from "../../src/wiremap.ts";
import type { Blocks } from "../app.ts";

type W = InferWire<Blocks, "post.service">;

export const $ = tagBlock();

export function getPosts(this: W) {
  const collection = this(".").collection;
  return collection.slice();
}
getPosts.is = "bound" as const;

/**
 * Retrieve a post from the database
 *
 * @param id - id of the post
 * @returns a post or undefined
 *
 * ```ts
 * const post = getPost('1234abcd')
 * ```
 */
export function getPost(wire: W) {
  const repo = wire("..").repo;
  return (id: string) => repo.find((post) => post.id === id);
}
getPost.is = "factory" as const;

/** Create a post in the database */
export function addPost(
  this: W,
  title: string,
  content: string,
  userId: string,
) {
  const getUser = this("user.service").getUser;
  const user = getUser(userId);
  if (!user) throw new Error(`User with id ${userId} does not exist.`);

  const repo = this("..").repo;
  const id = crypto.randomUUID();
  repo.push({ id, title, userId, content });
  return id;
}
addPost.is = "bound" as const;

/**
 * The posts collection of the database
 *
 * This docs will be displayed instead of the ones next to
 * the returned function. It's a typescript bug:
 * https://github.com/microsoft/TypeScript/issues/53167
 */
export const collection = async function (wire: W) {
  const repo = wire("..").repo;
  return await new Promise<typeof repo>((res) => {
    res(
      /** The posts collection of the database */
      repo,
    );
  });
};
collection.is = "asyncFactory" as const;
