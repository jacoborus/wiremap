import { tagBlock, type InferWire } from "../../../../src/wiremap.ts";
import type { Framework } from "../core.ts";
import { type User } from "./userRepo.ts";

export const $ = tagBlock();

type W = InferWire<Framework, "user.service">;

/**
 * Return a copy of the list of users
 */
export function getUsers(this: W): User[] {
  return this("user.repo").data.slice();
}
getUsers.is = "bound" as const;

/**
 * Finds the user with given email
 */
export function getUserByEmail(this: W, email: string): User | undefined {
  return this(".")
    .getUsers()
    .find((user) => user.email === email);
}
getUserByEmail.is = "bound" as const;

/**
 * Add a user to the database
 */
export function addUser(this: W, email: string, isAdmin = false) {
  const prevUser = this(".").getUserByEmail(email);
  if (prevUser) throw new Error("User already exists");

  this("user.repo").data.push({
    id: crypto.randomUUID(),
    email,
    isAdmin,
  });
}
addUser.is = "bound" as const;
