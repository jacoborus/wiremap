import { tagBlock } from "../../src/wiremap.ts";
import * as userService from "./userService.ts";

export const $ = tagBlock();

export const service = userService;
