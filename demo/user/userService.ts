import { tagBlock, type Wire } from "../../src/wiremap.ts";
import type { Defs } from "../app/app.ts";

export const $ = tagBlock();

type W = Wire<Defs, "user.service">;

export function getUsers(this: W) {
  const db = this().db;
  return db.users;
}
getUsers.isBound = true as const;

/**
 * Get an user by id
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

export function getUserByEmail(this: W, email: string) {
  const db = this().db;
  return db.users.find((user) => user.email === email);
}
getUserByEmail.isBound = true as const;

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
