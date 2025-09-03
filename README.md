# Wiremap

**Wiremap** is a lightweight, type-safe dependency injection framework for
TypeScript that favors **composition over inheritance**. It helps you build
scalable, maintainable, and testable applications with intuitive dependency
management.

---

⚠️ **PRE-RELEASE SOFTWARE**

This is an alpha version under active development. The API may change at any
time.

---

## ✨ Features

- **🔒 Type-Safe**: Full TypeScript support without extra boilerplate
- **🧱 Compositional**: Build complex apps from small, reusable units
- **♻️ Circular Dependency-Free**: Designed to avoid circular dependencies
- **🤯 No decorators. No classes.** No gorillas, no jungles. Just the bananas 🍌
- **🌲 Hierarchical**: Organize dependencies with namespaces and blocks
- **🧪 Testable**: Built-in utilities for mocking and isolation
- **🪶 Lightweight**: Minimal runtime overhead with smart caching
- **🔌 Zero Configuration**: Install and import, nothing else
- **🔨 Simple API**: So simple, it hurts

## 📦 Installation

```bash
# pick your package manager
npm install wiremap
pnpm add wiremap
deno add jsr:@jacobo/wiremap
bun add wiremap
```

## 🧩 Core Concepts

Wiremap applications are composed of **units**, organized into **hierarchical
blocks**. Units can depend on each other via **wires** provided by their blocks.

### Block

A block is an object that contains units or other blocks.\
There are two ways to define a block: as a file or with the `defineBlock`
helper.

> ℹ️ The root block (the top-level one) doesn’t need to be tagged or defined.\
> It can simply be a plain object.

#### Defining a block as a file

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

#### Defining a block with `defineBlock`

`defineBlock` is useful when you want to define multiple blocks in the same
file:

```ts
import { defineBlock } from "wiremap";

export const myService = defineBlock({
  // units and blocks here
});
export const myController = defineBlock({
  // ...
});
```

### Unit

Units are the smallest building blocks of your app.\
They can hold **any value** and are resolved lazily (on demand) and cached.\
To define a unit, add it to a block—either directly or with `defineUnit`.

```ts
import { defineUnit, tagBlock } from "wiremap";

export const $ = tagBlock();

// direct unit
export const myUnit = function () {};

// using the helper
export const myUnit = defineUnit(function () {});
```

👉 Use `as const` to ensure TypeScript infers precise literal types (e.g. `true`
instead of `boolean`).

---

#### Private units

Private units can only be used within their own block.\
Mark them with `isPrivate = true as const`:

```ts
// direct definition
export function myUnit() {}
myUnit.isPrivate = true as const;

// with helper
export const myUnit = defineUnit(
  () => {},
  { isPrivate: true },
);
```

---

#### Factory units

Factory units are functions that take the **wire** as their first argument and
return the unit.\
They’re lazy (initialized on first access) and cached.

```ts
export const myUnit = (wire: MyWire) => () => {
  return theUnitValue;
};
myUnit.isFactory = true as const;
```

With helper:

```ts
export const myUnit = defineUnit(
  (wire: MyWire) => () => theUnitValue,
  { isFactory: true },
);
```

---

#### Async factory units

Async factories return a Promise.\
When async factories exist, `wireUp()` returns a Promise that resolves once
everything is initialized and ready.

```ts
export async function myUnit(wire: MyWire) {
  await whatEver();
  return () => {};
}
myUnit.isFactory = true as const;
myUnit.isAsync = true as const;
```

With helper:

```ts
export const myUnit = defineUnit(
  async (wire: MyWire) => {
    await whatEver();
    return () => {};
  },
  { isFactory: true, isAsync: true },
);
```

---

#### Bound units

Bound units are functions that receive the wire as `this`.\
They must use the `function` keyword:

```ts
export function myUnit(this: MyWire) {
  const otherUnit = this().otherUnit;
}
myUnit.isBound = true as const;
```

With helper:

```ts
export const myUnit = defineUnit(
  function (this: MyWire) {
    const otherUnit = this().otherUnit;
  },
  { isBound: true },
);
```

---

### Wire

Every block with units has a **wire**: a function that gives access to units in
other blocks.\
It’s automatically injected into:

- **bound functions** as `this`
- **factories / async factories** as the first argument

You don’t need to create wires yourself, but you’ll usually want to infer their
types using `InferBlocks` and `InferWire`.

```ts
// -- main.ts --
import { type InferBlocks } from "wiremap";
import * as postMod from "./post/postMod.ts";
import * as userMod from "./user/userMod.ts";

const mainBlock = { user: userMod, post: postMod };
export type Blocks = InferBlocks<typeof mainBlock>;
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
myUnit.isBound = true as const;
```

Wires can resolve **current**, **root**, **child**, or **absolute** blocks:

- `this(".")` → current block
- `this()` → root block
- `this(".child")` → child block
- `this("path.to.block")` → absolute path

---

### Wire Up

To bootstrap your app, pass the root block to `wireUp()`.\
It returns the main wire (or a Promise if async factories exist):

```ts
import { type InferBlocks, wireUp } from "wiremap";
import * as mod1 from "./module1.ts";
import * as mod2 from "./module2.ts";

const mainBlock = { mod1, mod2 };
export type Blocks = InferBlocks<typeof mainBlock>;

const main = await wireUp(mainBlock);

const myUnit = main("mod1.service").myUnit;
```

---

## 🚀 Example

```ts
// config.ts
export const config = {
  port: 3000,
  host: "localhost",
  database: { url: "postgresql://localhost:5432/myapp" },
};

// userService.ts
import { type InferWire, tagBlock } from "wiremap";
import type { Blocks } from "./app.ts";

export const $ = tagBlock("user.service");
type Wire = InferWire<Blocks, "user.service">;

export function getUsers(this: Wire) {
  return this().database.users.findAll();
}
getUsers.isBound = true as const;

export const createUser = defineUnit(
  (wire: Wire) => {
    const db = wire().database;
    return (name: string, email: string) => {
      const user = { id: crypto.randomUUID(), name, email };
      db.users.create(user);
      return user;
    };
  },
  { isFactory: true },
);

// app.ts
import { type InferBlocks, wireUp } from "wiremap";
import { config } from "./config.ts";
import * as userService from "./userService.ts";
import * as database from "./database.ts";

const main = {
  config,
  database,
  user: defineBlock({ service: userService }),
};

export type Blocks = InferBlocks<typeof main>;

const app = await wireUp(main);

// Use the application
console.log("Users:", app("user.service").getUsers());
```

---

## 🧪 Testing

// TODO

---

## 📖 API Reference

👉 [API Documentation](https://jsr.io/@jacobo/wiremap)

## 🤝 Contributing

Contributions are welcome!

**💬 Questions or Feedback?**\
Open an issue on [GitHub](https://github.com/jacoborus/wiremap/issues)

## 📄 License

MIT © [Jacobo Tabernero Rey](https://github.com/jacoborus)
