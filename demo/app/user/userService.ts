import { defineUnit, type InferWire, tagBlock } from "../../../src/wiremap.ts";
import type { Circuit } from "../appCircuit.ts";

export const $ = tagBlock();

type W = InferWire<Circuit["__hub"], "user.service">;

/** List the users */
export function getUsers(this: W) {
  const repo = this("user").repo;
  return repo.slice();
}
getUsers.is = "bound" as const;

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
export const getUser = defineUnit(
  (w: W) => {
    const repo = w("user").repo;
    return (id: string) => repo.find((user) => user.id === id);
  },
  { is: "factory" },
);

/** Get a user by its email */
export const getUserByEmail = defineUnit(
  function (this: W, email: string) {
    const repo = this("user").repo;
    return repo.find((user) => user.email === email);
  },
  { is: "bound" },
);

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
  const repo = this("user").repo;
  repo.push(user);
  return user.id;
}
addUser.is = "bound" as const;
