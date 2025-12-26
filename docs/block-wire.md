# Block Wire

Every block with units has a **wire**: a function that gives access to units in other blocks.
It’s automatically injected into:

- **bound functions** as `this`
- **factories / async factories** as the first argument

You don’t need to create wires yourself, but you’ll usually want to infer their types using `InferCircuit` and `InferWire`.

```ts
// -- main.ts --
import { type InferCircuit } from "wiremap";
import * as postMod from "./post/postMod.ts";
import * as userMod from "./user/userMod.ts";

const mainBlock = { user: userMod, post: postMod };
export type Blocks = InferCircuit<typeof mainBlock>;
```

Now use `InferWire` to type your wire:

```ts
// -- userService.ts --
import { type InferWire, tagBlock } from "wiremap";
import type { Blocks } from "../main.ts";

type Wire = InferWire<Blocks, "user.service">;

export const $ = tagBlock();

export function myUnit(this: Wire) {
  return this("post.service").getPosts();
}
myUnit.is = 'bound' as const;
```

Wires can resolve **current**, **root**, or **absolute** blocks:

- `this(".")` → current block
- `this()` → root block
- `this("path.to.block")` → absolute path

