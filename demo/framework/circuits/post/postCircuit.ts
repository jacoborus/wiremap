import { defineInputs, defineCircuit } from "../../../../src/wiremap.ts";
import type { InferOutput } from "../../../../src/wiremap.ts";
import type { UserCircuit } from "../user/userCircuit.ts";

import * as postService from "./postService.ts";
import * as postRepo from "./postRepo.ts";

type UserOutput = InferOutput<UserCircuit>;

export const postCircuit = defineCircuit(
  {
    service: postService,
    repo: postRepo,
  },
  defineInputs<{
    $userService: UserOutput["service"];
  }>(),
);

export type PostCircuit = typeof postCircuit;
