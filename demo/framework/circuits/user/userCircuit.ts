import { defineCircuit } from "../../../../src/wiremap.ts";

import * as userService from "./userService.ts";
import * as userRepo from "./userRepo.ts";

export const userCircuit = defineCircuit(
  {
    service: userService,
    repo: userRepo,
  },
  {},
);

export type UserCircuit = typeof userCircuit;
