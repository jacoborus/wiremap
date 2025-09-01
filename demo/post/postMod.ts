import { defineUnit, tagBlock } from "../../src/wiremap.ts";

import * as postService from "./postService.ts";
import postRepo from "./postRepo.ts";

export const $ = tagBlock();

export const service = postService;
export const repo = defineUnit(postRepo);
