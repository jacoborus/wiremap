import { tagBlock } from "../../../src/wiremap.ts";

export interface Post {
  id: string;
  content: string;
  published: boolean;
}

export const $ = tagBlock();

export const data: Post[] = [];
