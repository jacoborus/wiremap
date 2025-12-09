import { defineCircuit } from "../../../../src/wiremap.ts";
import type { BulkCircuitDef } from "../../../../src/circuit.ts";

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
