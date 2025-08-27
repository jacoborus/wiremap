import { tagBlock } from "../../src/wiremap.ts";
import * as postService from "./postService.ts";

export const $ = tagBlock();

export const service = postService;
