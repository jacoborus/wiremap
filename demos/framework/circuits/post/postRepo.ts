import { tagBlock } from "wiremap";

export interface Post {
  id: string;
  userId: string;
  title: string;
  content: string;
  published: boolean;
}

export const $ = tagBlock();

export const data: Post[] = [];
