# Wiremap

**Wiremap** is a lightweight, type-safe dependency injection framework for
TypeScript that favors composition over inheritance. Build scalable,
maintainable, and testable applications with intuitive and powerful dependency
management.

---

⚠️ **PRE-RELEASE SOFTWARE**

This is an alpha version under active development. The API is subject to change.

---

## ✨ Features

- **🔒 Type-Safe**: Full TypeScript support without manual type annotations
- **🧱 Compositional**: Compose complex applications from small, reusable units
- **♻️ Circular Dependency-Free**: Designed to eliminate circular dependencies
- **🤯 No decorators, no classes**, no gorillas, no jungles. Just the bananas
- **🌲 Hierarchical**: Organize dependencies using namespaces and blocks
- **🧪 Testable**: Built-in utilities for easy mocking and isolated testing
- **🪶 Lightweight**: Minimal runtime overhead with smart, built-in caching
- **🔌 Zero Configuration**: Just install and import, no setup needed
- **🔨 Simple API**: So simple, it hurts

## 📦 Installation

```bash
# choose your poison
npm install wiremap
pnpm add wiremap
deno add jsr:@jacobo/wiremap
bun add wiremap
```

## Concepts

Wiremap applications are composed of **units** organized into **hierarchical
blocks**. Units can be injected into each other using **wires** provided by
their blocks.

### Block

Blocks are objects containing units or other blocks. There are 2 ways to create
a block: with a file or with the `defineBlock` helper

Note: The main/root block (the one at the highest level) does not need to be
tagged of defined. It can be a regular plain object

#### Define a block as a file

To tag a file as a block, export a block tag as "**$**":

```ts
// -- myBlock.ts --
import { tagBlock } from 'wiremap';

// tag the file as a block
export const $ = tagBlock();

// export your units and blocks
export const myUnit = ...;
export const otherBlock = ...;
```

Use file blocks by importing them as "*":

```ts
// -- myParentBlock.ts --
import { tagBlock } from "wiremap";
import * as myBlock from "./myBlock.ts";

// tag the file as a block
export const $ = tagBlock();

// expose myBlock as aService
export const myService = myBlock;
```

Blocks can be directly imported and exported in one line:

```ts
// -- myParentBlock.ts --
import { tagBlock } from "wiremap";

// export it as part of another block
export * as myService from "./myBlock.ts";

// tag the file as a block
export const $ = tagBlock();
```

#### Define a block with the `defineBlock` helper

The `defineBlock` helper is useful to define several blocks in the same file

```ts
import { defineBlock } from "wiremap";

export const myService = defineBlock({
  // units and blocks here
});
export const myController = defineBlock({
  // ....
});
```

### Unit

Units are the building blocks of your application. They can be any kind of value
and are resolved and cached on demand. To define a unit, it has to be added to a
block, directly as a property, or with the `defineUnit` helper.

```ts
import { defineUnit, tagBlock } from "wiremap";

export const $ = tagBlock();

// direct unit definition
export const myUnit = function () {};

// with the unit helper
export const myUnit = defineUnit(
  function () {},
);
```

**Important**: The `as const` assertion ensures TypeScript infers the literal
type `true` rather than the broader `boolean` type.

#### Private units

Private units are only accessible within their own block and cannot be accessed
from other blocks or the root level. To mark a unit as private, set the
`isPrivate` property to `true as const`.

Direct private unit definition:

```ts
// define your unit
export function myUnit() {}

// mark it as private
myUnit.isPrivate = true as const;
```

Define private units with the `defineUnit` helper:

```ts
// define your unit
export const myUnit = defineUnit(
  function () {},
  // mark it as private
  { isPrivate: true },
);
```

#### Factory units

Factory units are functions that receive the wire as first argument, and return
the unit.

Factories are resolved lazily (on first access) and their results are cached for
quick resolution on subsequent calls. This provides efficient initialization
because only the units you actually use get created.

Direct factory unit definition:

```ts
// define your unit
export const myUnit = (wire: MyWire) => () => {
  // do something with the wire
  // return the unit
  return theUnitValue;
};
// mark it as factory
myUnit.isFactory = true as const;
```

With `defineUnit` helper:

```ts
export const myUnit = defineUnit(
  (wire: MyWire) => () => {
    return theUnitValue;
  },
  // mark it as factory
  { isFactory: true },
);
```

#### Async Factory units

Async factory units define the units as their awaited return type.

When async factories are present, `wireUp()` returns a Promise that resolves
once all async factories have completed their initialization. This ensures that
by the time you can access units, all asynchronous dependencies are fully ready.
Like all factories, the resolved values are cached for quick access on
subsequent calls.

Direct async factory unit definition:

```ts
// define your unit
export async function myUnit(wire: MyWire) {
  await whatEver();
  return function () {};
}

// mark it as factory
myUnit.isFactory = true as const;
// mark it as async factory
myUnit.isAsync = true as const;
```

With `defineUnit` helper:

```ts
export const myUnit = defineUnit(
  async (wire: MyWire) => {
    await whatEver();
    return function () {};
  },
  // mark it as async factory
  {
    isFactory: true,
    isAsync: true,
  },
);
```

#### Bound units

Bound units are functions that receive the wire as `this`. Bound functions have
to be declared with the `function` keyword.

Direct bound unit definition:

```ts
// define your unit
export function myUnit(this: MyWire) {
  const otherUnit = this().otherUnit;
  // do something with otherUnit
}

// mark it as bound
myUnit.isBound = true as const;
```

With `defineUnit` helper:

```ts
export const myUnit = defineUnit(
  function (this: MyWire) {
    const otherUnit = this().otherUnit
      // do something with otherUnit
    }
  },

  // mark it as bound
  { isBound: true }
)
```

### Wire

Every block that contains units has a wire, this wire is a function that
provides access to units from other blocks. It's automatically injected into
every bound function as `this`, and every factory and async factory function as
the first argument.

Wires can only be called from within function units.

This means you don't have to create any wire, but you'll want to infer its type.
To do this you'll first need to infer the type of the main/root block of your
app with `InferBlocks`, and export it:

```ts
// -- main.ts --
import { type InferBlocks } from "wiremap";

// import your blocks
import * as postMod from "./post/postMod.ts";
import * as userMod from "./user/userMod.ts";

const mainBlock = {
  user: userMod,
  post: postMod,
};

export type Blocks = InferBlocks<typeof mainBlock>;
```

Import the type of your main block, and use it with the namespace or your block
to infer the type of the wire with `InferWire`

```ts
// -- userService.ts --
import { type InferWire, tagBlock } from "wiremap";
import type { Blocks } from "../main.ts";

type Wire = InferWire<Blocks, "user.service">;

export const $ = tagBlock();

export function myUnit(this: Wire) {
  const getPosts = this("post.service").getPosts;
  return getPosts();
}
myUnit.isBound = true as const;
```

The wire can get called with the namespace, or relative path of any block that
contains units, it will return a proxy containing all the units of that block.
Those units will get resolved the first time they get called, and cached it for
later.

#### Current block resolution

To access the units of the same block, call the wire with a dot "." as argument:

```ts
export function myUnit(this: Wire) {
  const config = this(".").config;
  return config;
}
myUnit.isBound = true as const;
```

#### Root block resolution

To access the units of the main block of your app, call the wire with no
arguments:

```ts
export function myUnit(this: Wire) {
  const config = this().config;
  return config;
}
myUnit.isBound = true as const;
```

#### Child block resolution

To access the units of blocks under the current one, use the relative path
beginning with a dot ".":

```ts
export function myUnit(this: Wire) {
  const getPosts = this(".service").getPosts;
  return getPosts();
}
myUnit.isBound = true as const;
```

#### Absolute path block resolution

To access the units of any block of the app, use the absolute path of the block:

```ts
export function myUnit(this: Wire) {
  const getPosts = this("post.service").getPosts;
  return getPosts();
}
myUnit.isBound = true as const;
```

### Start up

// TODO

## 🚀 Example

```ts
// config.ts
export const config = {
  port: 3000,
  host: "localhost",
  database: {
    url: "postgresql://localhost:5432/myapp",
  },
};

// userService.ts
import { type InferWire, tagBlock } from "wiremap";
import type { Blocks } from "./app.ts";

export const $ = tagBlock("user.service");
type Wire = InferWire<Blocks, "user.service">;

export function getUsers(this: Wire) {
  const db = this().database;
  return db.users.findAll();
}
getUsers.isBound = true as const;

export function createUser(wire: Wire) {
  const db = wire().database;
  return function (name: string, email: string) {
    const user = { id: crypto.randomUUID(), name, email };
    db.users.create(user);
    return user;
  };
}
createUser.isFactory = true as const;

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
const users = app("user.service").getUsers();
console.log("Users:", users);
```

## 📖 API Reference

Check https://jsr.io/@jacobo/wiremap

## 🧪 Testing

Wiremap provides a simple and powerful testing approach using the `.feed()`
method on block tags to inject test dependencies.

### Testing with `.feed()`

Use the `.feed()` method on block tags to provide mock implementations for
testing:

```ts
import { assertEquals } from "@std/assert";
import { $, addUser, getUsers } from "./userService.ts";
import type { Database } from "../db.ts";

Deno.test(function addUserTest() {
  // Create test database
  const db: Database = { users: [], posts: [] };

  // Feed mock dependencies to the block
  $.feed({
    "": {
      db, // Root-level dependency
    },
    "user.service": {
      // Mock local dependencies within the same block
      getUserByEmail: (email: string) => {
        return db.users.find((user) => user.email === email);
      },
    },
  });

  // Test the functionality
  let users = getUsers();
  assertEquals(users.length, 0);

  addUser("john", "john@example.com", true);

  users = getUsers();
  assertEquals(users.length, 1);
  assertEquals(users[0].name, "john");
});
```

### Cross-Block Testing

You can mock dependencies from other blocks:

```ts
import { $, addPost, getPost } from "./postService.ts";

Deno.test(function addPostTest() {
  $.feed({
    "": {
      db: { users: [], posts: [] },
    },
    "user.service": {
      // Mock dependency from another block
      getUser: (id: string) => ({
        id,
        name: "testuser",
        email: "test@example.com",
        isAdmin: true,
      }),
    },
  });

  const postId = addPost("Test Title", "Test Content", "user123");
  const post = getPost(postId);

  assertEquals(post?.title, "Test Title");
  assertEquals(post?.userId, "user123");
});
```

## 🤝 Contributing

Contributions are welcome!

**💬 Questions or Feedback?**\
Open an issue on [GitHub](https://github.com/jacoborus/wiremap/issues)

## 📄 License

MIT © [Jacobo Tabernero Rey](https://github.com/jacoborus)
