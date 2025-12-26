# Block

A block is an object that contains units or other blocks.
There are two ways to define a block: as a file or with the `defineBlock` helper.

> ℹ️ The root block (the top-level one) doesn’t need to be tagged or defined.\
> It can simply be a plain object.

## Defining a block with `defineBlock`

`defineBlock` is useful when you want to define multiple blocks in the same
file:

```ts
import { defineBlock } from "wiremap";

export const myService = defineBlock({
  // units and blocks here
});
```

## Defining a block with the `$` prefix

Inside another block, name an object with the `$` prefix:

```ts
import { defineBlock } from "wiremap";

export const myService = defineBlock({
  // units and blocks here
  $otherBlock: {
    // units and blocks here
  }
});
```

## Defining a block as a file

To mark a file as a block, export a special tag named `$`:

```ts
// -- myBlock.ts --
import { tagBlock } from "wiremap";

// tag the file as a block
export const $ = tagBlock();

// export your units and sub-blocks
export const myUnit = ...;
export const otherBlock = ...;
```

Use file blocks by importing them as `*`:

```ts
// -- myParentBlock.ts --
import { tagBlock } from "wiremap";
import * as myBlock from "./myBlock.ts";

export const $ = tagBlock();

// expose myBlock as a service
export const myService = myBlock;
```

Or directly re-export them in one line:

```ts
// -- myParentBlock.ts --
import { tagBlock } from "wiremap";

export * as myService from "./myBlock.ts";
export const $ = tagBlock();
```
