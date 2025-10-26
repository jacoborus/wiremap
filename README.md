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

## 📑 Table of contents

- [Wiremap](#wiremap)
  - [✨ Features](#-features)
  - [📑 TOC](#-table-of-contents)
  - [🏛 Architecture-Agnostic](#-architecture-agnostic)
  - [📦 Installation](#-installation)
  - [🧩 Core Concepts](#-core-concepts)
    - [Block](#block)
    - [Unit](#unit)
    - [Wire](#wire)
    - [Wire Up](#wire-up)
    - [Mock unit](#mock-unit)
  - [🚀 Example](#-example)
  - [🧪 Testing](#-testing)
  - [📖 API Reference](#-api-reference)
  - [🤝 Contributing](#-contributing)
  - [📄 License](#-license)

## 🏛 Architecture-Agnostic

Wiremap is architecture-agnostic. It doesn’t enforce a particular structure but
adapts naturally to any software design approach. Whether you’re building with
**Hexagonal Architecture**, **Domain-Driven Design (DDD)**, or the **Ports and
Adapters** pattern, Wiremap makes it simple to express clear boundaries between
layers. Its compositional blocks and type-safe wires let you organize services,
domains, infrastructure, and application logic in a way that fits your chosen
methodology. You can even combine patterns without fighting the framework.\
Wiremap’s role is to provide clean, dependency-free wiring, no matter how you
shape your architecture.

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
myUnit.is = 'factory' as const;
```

With helper:

```ts
export const myUnit = defineUnit(
  (wire: MyWire) => () => theUnitValue,
  { is: 'factory' },
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
myUnit.is = 'asyncFactory' as const;
```

With helper:

```ts
export const myUnit = defineUnit(
  async (wire: MyWire) => {
    await whatEver();
    return () => {};
  },
  { is: 'asyncFactory' },
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
myUnit.is = 'bound' as const;
```

With helper:

```ts
export const myUnit = defineUnit(
  function (this: MyWire) {
    const otherUnit = this().otherUnit;
  },
  { is: 'bound' },
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
types using `InferCircuit` and `InferWire`.

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

---

### Wire Up

To bootstrap your app, pass the root block to `wireUp()`.\
It returns the main wire (or a Promise if async factories exist):

```ts
import { type InferCircuit, wireUp } from "wiremap";
import * as mod1 from "./module1.ts";
import * as mod2 from "./module2.ts";

const mainBlock = { mod1, mod2 };
export type Blocks = InferCircuit<typeof mainBlock>;

const main = await wireUp(mainBlock);

const myUnit = main("mod1.service").myUnit;
```

---

### Mock unit

Wiremap includes built-in utilities to make testing easy and reliable. Because
blocks and units are fully compositional, you can swap out real implementations
with mocks, stubs, or fakes, ensuring tests stay isolated and predictable.

The `mockUnit` helper lets you replace the dependencies of a unit under test
with controlled fake values. This way you can test logic in complete isolation,
without touching databases, APIs, or other external systems.

Here’s an example using a `postService` module:

```ts
import { mockUnit } from "../../src/mock.ts";

import * as postService from "./postService.ts";

// Fake blocks used during testing
const fakeBlocks = {
  // override a repository with an in-memory array
  "..": { repo: [] },

  // replace user service with a mock
  "user.service": {
    getUser: (id: string) => ({
      id,
      name: "jacobo",
      email: "jacobo@example.com",
      isAdmin: true,
    }),
  },
};

// Create mocked versions of the real units
const addPost = mockUnit(postService.addPost, fakeBlocks);
const getPost = mockUnit(postService.getPost, fakeBlocks);

// Run the test
const postId = addPost("titulo", "contenido", "11234");
const post = getPost(postId);

if (!post) throw new Error("Post not found");

assertEquals(post.id, postId);
assertEquals(post.title, "titulo");
assertEquals(post.content, "contenido");
assertEquals(post.userId, "11234");
```

This allows you to test the business logic of your unit without depending on
real infrastructure. By controlling the wire through fakeBlocks, you can
precisely simulate the environment needed for each test case.

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
getUsers.is = 'bound' as const;

export const createUser = defineUnit(
  (wire: Wire) => {
    const db = wire().database;
    return (name: string, email: string) => {
      const user = { id: crypto.randomUUID(), name, email };
      db.users.create(user);
      return user;
    };
  },
  { is: 'factory' },
);

// app.ts
import { type InferCircuit, wireUp } from "wiremap";
import { config } from "./config.ts";
import * as userService from "./userService.ts";
import * as database from "./database.ts";

const main = {
  config,
  database,
  user: defineBlock({ service: userService }),
};

export type Blocks = InferCircuit<typeof main>;

const app = await wireUp(main);

// Use the application
console.log("Users:", app("user.service").getUsers());
```

## 📖 API Reference

👉 [API Documentation](https://jsr.io/@jacobo/wiremap)

## 🤝 Contributing

Contributions are welcome!

**💬 Questions or Feedback?**\
Open an issue on [GitHub](https://github.com/jacoborus/wiremap/issues)

## 📄 License

MIT © [Jacobo Tabernero Rey](https://github.com/jacoborus)
