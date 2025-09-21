import { type InferBlocks } from "../../../src/wiremap.ts";

import * as userMod from "./user/userMod.ts";

const configBase = {
  port: 3000,
  host: "localhost",
};

export const coreDefs = {
  configBase,
  user: userMod,
  hola: "hola",
};

export type Framework = InferBlocks<typeof coreDefs>;
