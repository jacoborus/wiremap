import { defineUnit, tagBlock, type InferWire } from "../../src/wiremap.ts";
import type { Blocks } from "../app.ts";

type W = InferWire<Blocks, "post">;

import * as postService from "./postService.ts";
import postRepo from "./postRepo.ts";

export const $ = tagBlock();

export const service = postService;
export const repo = defineUnit(postRepo);

export function childResolution(this: W) {
  const getPosts = this(".service").getPosts;
  return getPosts();
}
childResolution.isBound = true as const;
