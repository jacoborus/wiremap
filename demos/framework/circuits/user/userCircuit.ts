import { defineCircuit } from "wiremap";
import type { BulkCircuitDef } from "wiremap";

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

type X = UserCircuit extends BulkCircuitDef ? true : false;
