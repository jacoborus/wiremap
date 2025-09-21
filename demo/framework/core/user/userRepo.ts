import { tagBlock } from "../../../../src/wiremap.ts";

export type User = {
  id: string;
  email: string;
  isAdmin: boolean;
};

export const $ = tagBlock();
export const data: User[] = [];
