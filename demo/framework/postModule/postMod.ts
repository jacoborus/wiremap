import { type InferWire, tagBlock } from "../../../src/wiremap.ts";
import { type PostPlugin } from "./postPlugin.ts";

type W = InferWire<PostPlugin, "">;

import * as postService from "./postService.ts";
import * as postRepo from "./postRepo.ts";

export const $ = tagBlock();

export const service = postService;
export const repo = postRepo;
