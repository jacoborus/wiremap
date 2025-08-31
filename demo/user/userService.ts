import { tagBlock, type Wire } from "../../src/wiremap.ts";
import type { Blocks } from "../app/app.ts";

export const $ = tagBlock();

type W = Wire<Blocks, "user.service">;

/** List the users */
export function getUsers(this: W) {
  const { db } = this();
  return db.users;
}
getUsers.isBound = true as const;

/**
 * Get a user by id
 *
 * @param id - Id of the user
 * @returns  a user or undefined
 *
 * ```ts
 * const user = getUser('1234')
 * ```
 */
export function getUser(this: W, id: string) {
  const db = this().db;
  return db.users.find((user) => user.id === id);
}
getUser.isBound = true as const;

/** Get a user by its email */
export function getUserByEmail(this: W, email: string) {
  const db = this().db;
  return db.users.find((user) => user.email === email);
}
getUserByEmail.isBound = true as const;

/**
 * Add a user into the database
 *
 * @param name - Full name of the user
 * @param email - Email of the user
 * @param isAdmin - Whether the user is an admin
 * @returns  The id of the user
 */
export function addUser(this: W, name: string, email: string, isAdmin = false) {
  const getUserByEmail = this(".").getUserByEmail;
  const existingUser = getUserByEmail(email);
  if (existingUser) {
    throw new Error(`User with email ${email} already exists.`);
  }

  const user = {
    id: crypto.randomUUID(),
    name,
    email,
    isAdmin,
  };
  const db = this().db;
  db.users.push(user);
  return user.id;
}
addUser.isBound = true as const;
