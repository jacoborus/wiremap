import { tagBlock } from "../../../../src/wiremap.ts";

import * as userService from "./userService.ts";
import * as userRepo from "./userRepo.ts";

export const $ = tagBlock();

export const service = userService;
export const repo = userRepo;
