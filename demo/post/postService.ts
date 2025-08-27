import { defineUnit, tagBlock } from "../../src/wiremap.ts";
import type { Defs } from "../app/app.ts";

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
export function getPost(this: W, id: string) {
  const db = this().db;
  return db.posts.find((post) => post.id === id);
}
getPost.isBound = true as const;

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
 * The posts collection of the database
 */
export function collection(w: W) {
  const db = w().db;
  return db.posts;
}
collection.isFactory = true as const;
