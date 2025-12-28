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

## Features

- **Type-Safe**: Full TypeScript support without extra boilerplate
- **Compositional**: Build complex apps from small, reusable units
- **Circular Dependency-Free**: Designed to avoid circular dependencies
- **No decorators. No classes.** No gorillas, no jungles. Just the bananas 🍌
- **Hierarchical**: Organize dependencies with namespaces and blocks
- **Testable**: Built-in utilities for mocking and isolation
- **Lightweight**: Minimal runtime overhead with smart caching
- **Zero Configuration**: Install and import, nothing else
- **Simple API**: So simple, it hurts


## Architecture-Agnostic

Wiremap is architecture-agnostic. It doesn’t enforce a particular structure but
adapts naturally to any software design approach. Whether you’re building with
**Hexagonal Architecture**, **Domain-Driven Design (DDD)**, or the **Ports and
Adapters** pattern, Wiremap makes it simple to express clear boundaries between
layers. Its compositional blocks and type-safe wires let you organize services,
domains, infrastructure, and application logic in a way that fits your chosen
methodology. You can even combine patterns without fighting the framework.\
Wiremap’s role is to provide clean, dependency-free wiring, no matter how you
shape your architecture.

## Installation

```bash
# pick your package manager
npm install wiremap
pnpm add wiremap
deno add jsr:@jacobo/wiremap
bun add wiremap
```

## Core Concepts

Wiremap applications are composed of **units**, organized into **hierarchical
blocks**. Units can depend on each other via **wires** provided by their blocks.


## Docs

- [Unit](./docs/unit.md)
- [Block](./docs/block.md)
- [Circuit](./docs/circuit.md)
- [Mock](./docs/mock.md)
- [BlockWire](./docs/block-wire.md)
- [Wire Up](./docs/wire-up.md)

## Example

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
import { type InferCircuit, wireUp, defineCircuit } from "wiremap";
import { config } from "./config.ts";
import * as userService from "./userService.ts";
import * as database from "./database.ts";

const main = defineCircuit({
  config,
  database,
  user: defineBlock({ service: userService }),
});

export type Blocks = InferCircuit<typeof main>;

const app = await wireUp(main);

// Use the application
console.log("Users:", app("user.service").getUsers());
```

## API Reference

[API Documentation](https://jsr.io/@jacobo/wiremap)

## Contributing

Contributions are welcome!

**Questions or Feedback?**\
Open an issue on [GitHub](https://github.com/jacoborus/wiremap/issues)

## License

MIT © [Jacobo Tabernero Rey](https://github.com/jacoborus)
