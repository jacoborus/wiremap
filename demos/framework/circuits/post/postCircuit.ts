import { defineInputs, defineCircuit } from "wiremap";
import type { InferOutput } from "wiremap";

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
