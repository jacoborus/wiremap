import { defineUnit, tagBlock } from "wiremap";

import * as postService from "./postService.ts";
import postRepo from "./postRepo.ts";

export const $ = tagBlock();
export const service = postService;
export const repo = defineUnit(postRepo);
