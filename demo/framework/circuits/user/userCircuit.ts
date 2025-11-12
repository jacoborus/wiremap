import { defineCircuit, defineInputs } from "../../../../src/wiremap.ts";

import * as userService from "./userService.ts";
import * as userRepo from "./userRepo.ts";

export const userCircuit = defineCircuit(
  {
    service: userService,
    repo: userRepo,
  },
  {
    inputs: defineInputs<{
      // $algo: {
      //   $otro: {
      //     a: number;
      //   };
      // };
    }>(),
  },
);

export type UserCircuit = typeof userCircuit;
