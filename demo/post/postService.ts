import { tagBlock, type Wire } from "../../src/wiremap.ts";
import type { Defs } from "../app/app.ts";

type W = Wire<Defs, "post.service">;

export const $ = tagBlock();

export function getPosts(this: W) {
  const collection = this(".").collection;
  return collection.slice();
}
getPosts.isBound = true as const;

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
  const db = wire().db;
  return (id: string) => db.posts.find((post) => post.id === id);
}
getPost.isFactory = true as const;

export function addPost(
  this: W,
  title: string,
  content: string,
  userId: string,
) {
  const getUser = this("user.service").getUser;
  const user = getUser(userId);
  if (!user) throw new Error(`User with id ${userId} does not exist.`);

  const db = this().db;
  const id = crypto.randomUUID();
  db.posts.push({ id, title, userId, content });
  return id;
}
addPost.isBound = true as const;

/**
 * The WRONG docs!!!
 */
export const collection = async function (wire: W) {
  const db = wire().db;
  return await new Promise<typeof db.posts>((res) => {
    res(
      /**
       * The CORRECT docs!!!
       * The posts collection of the database
       */
      db.posts,
    );
  });
};
collection.isFactory = true as const;
collection.isAsync = true as const;
