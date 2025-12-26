# Circuit

A circuit is a higher-level abstraction that wraps blocks and provides a clean interface for composition and dependency management. While blocks organize units internally, circuits define the external contract of how different parts of your application connect to each other.

## Why Circuits?

Circuits solve several important problems:

- **Interface Definition** - Clearly declare what a module needs (inputs) and what it provides (outputs)
- **Type-Safe Composition** - Connect different modules with compile-time type checking
- **Architectural Boundaries** - Create clear separation between different parts of your application
- **Reusability** - Define modules that can be easily reused in different contexts

## Basic Circuit Definition

Use `defineCircuit()` to create a circuit from blocks and units:

```ts
import { defineCircuit } from "wiremap";

const dataCircuit = defineCircuit({
  myUnit: 'something',
  $myBlock: {
    otherUnit: () => 42
  }, 
}, {});
```

The first argument to `defineCircuit()` is the hub containing all blocks and units. The second argument defines the inputs (dependencies) this circuit needs from other circuits.

## Circuit Inputs

Use `defineInputs()` to declare dependencies that your circuit needs from the outside:

```ts
import { defineCircuit, defineInputs } from "wiremap";

type W = InferWire<typeof userCircuit, 'service'>

function createArticle: (this: W, title: string, content: string) => {
  const repo = this('blogRepo'); 

  if (title.length < 3) {
    throw Error('Title too short')
  }

  repo.save({
    id: crypto.randomUUID(),
    title,
    content,
  }) 
}
createArticle.is = 'bound' as const;

const userCircuit = defineCircuit(
  {
    $service: { createArticle },
  },
  defineInputs<{
    $blogRepo: {
      save: (article: Article) => Promise<void>;
    };
  }>()
);
```

The `defineInputs<...>()` function creates a type-safe input specification. The circuit will require these dependencies to be provided when used.

## Type Inference and Output

Circuits provide strong type inference for both their inputs and outputs:

```ts
import type { InferOutput } from "wiremap";

// From the previous example
type UserCircuitOutput = InferOutput<typeof userCircuit>;
//   ^? {
//       service: {
//         createUser: (name: string, email: string) => {
//           id: string;
//           name: string;
//           email: string;
//         };
//       };
//     }
```

The `InferOutput<Circuit>` type extracts what the circuit provides to the outside world, excluding any private units.

## Circuit Composition with `plug`

**Important**: Circuits cannot be added directly to other circuits. If you pass a circuit to another circuit, it will be ignored. Circuits must be connected using the `plug` function.

The `plug` function takes two arguments:
1. **The circuit to plug** - The child circuit you want to include
2. **An adapter** - A mapping that matches the child circuit's inputs to the parent's blocks

### Basic Plugging

```ts
import { defineCircuit, defineInputs, plug, wireUp } from "wiremap";

// === Database Circuit ===
const databaseCircuit = defineCircuit({
  connection: { url: "postgres://localhost:5432" },
  repository: { save: async (data: any) => console.log("Saving:", data) },
}, {});

// === User Circuit ===
const userCircuit = defineCircuit(
  {
    service: {
      createUser: defineUnit(function (this: W, name: string, email: string) {
        const user = { id: crypto.randomUUID(), name, email };
        const repo = this('repository')
        repo.save(user);
        return user;
      }, { is: 'bound' }),
    },
  },
  defineInputs<{
    repository: {
      save: (data: any) => Promise<void>;
    };
  }>()
);

// === Application Circuit ===
const appCircuit = defineCircuit({
  database: databaseCircuit,
  
  // Plug the user circuit into the application
  user: plug(userCircuit, {
    // Map userCircuit's "repository" input to app's "database.repository" block
    repository: "database.repository",
  }),
  
}, {});
```

### Complex Adapter Mappings

The adapter can map inputs to different paths and even rename them:

```ts
const appCircuit = defineCircuit({
  database: databaseCircuit,
  cache: cacheCircuit,
  
  userService: plug(userCircuit, {
    // Map to nested blocks
    repository: "database.repository",
    // Map to different block names
    logger: "cache.logging",
  }),
  
  postService: plug(postCircuit, {
    // Map multiple inputs
    repository: "database.repository",
    userService: "userService.service",
    // Use nested mappings for complex paths
    cache: {
      get: "cache.client.get",
      set: "cache.client.set",
    },
  }),
}, {});
```

### Type-Safe Adapter Mapping

The adapter provides type safety - TypeScript will error if you try to map an input that doesn't exist or map to an invalid path:

```ts
// ✅ This works - all inputs are properly mapped
const userPlugin = plug(userCircuit, {
  repository: "database.repository",
});

// ❌ TypeScript error - "nonexistent" is not an input of userCircuit
const badPlugin = plug(userCircuit, {
  repository: "database.repository",
  nonexistent: "somewhere.else", // Error!
});

// ❌ TypeScript error - missing required input "repository"
const incompletePlugin = plug(userCircuit, {}); // Error!
```

## Real-World Example

Here's a complete example showing how to structure a modular web application with proper circuit plugging:

```ts
// === Database Module (database/circuit.ts) ===
import { defineCircuit, tagBlock } from "wiremap";

const databaseBlocks = {
  $: tagBlock(),
  connection: { url: "postgres://localhost:5432" },
  
  userRepo: {
    findById: (id: string) => ({ id, name: "John", email: "john@example.com" }),
    save: async (user: any) => console.log("Saving user:", user),
  },
  
  postRepo: {
    findByAuthor: (authorId: string) => [
      { id: "1", title: "Hello World", authorId },
    ],
    save: async (post: any) => console.log("Saving post:", post),
  },
};

export const databaseCircuit = defineCircuit({
  connection: databaseBlocks.connection,
  repos: databaseBlocks,
}, {});

// === User Service Module (user/circuit.ts) ===
import { defineCircuit, defineInputs, tagBlock } from "wiremap";

const userBlocks = {
  $: tagBlock(),
  
  service: {
    getUser: (id: string, repos: any) => repos.userRepo.findById(id),
    createUser: async (name: string, email: string, repos: any) => {
      const user = { id: crypto.randomUUID(), name, email };
      await repos.userRepo.save(user);
      return user;
    },
  },
};

export const userCircuit = defineCircuit(
  {
    service: userBlocks.service,
  },
  defineInputs<{
    repos: {
      userRepo: {
        findById: (id: string) => any;
        save: (user: any) => Promise<void>;
      };
    };
  }>()
);

// === Post Service Module (post/circuit.ts) ===
import { defineCircuit, defineInputs, tagBlock } from "wiremap";

const postBlocks = {
  $: tagBlock(),
  
  service: {
    getPostsByAuthor: (authorId: string, repos: any) => 
      repos.postRepo.findByAuthor(authorId),
    createPost: async (title: string, content: string, authorId: string, repos: any) => {
      const post = { id: crypto.randomUUID(), title, content, authorId };
      await repos.postRepo.save(post);
      return post;
    },
  },
};

export const postCircuit = defineCircuit(
  {
    service: postBlocks.service,
  },
  defineInputs<{
    repos: {
      postRepo: {
        findByAuthor: (authorId: string) => any[];
        save: (post: any) => Promise<void>;
      };
    };
  }>()
);

// === Application Circuit (app/circuit.ts) ===
import { defineCircuit, plug } from "wiremap";
import { databaseCircuit } from "../database/circuit.ts";
import { userCircuit } from "../user/circuit.ts";
import { postCircuit } from "../post/circuit.ts";

export const appCircuit = defineCircuit({
  database: databaseCircuit,
  
  // Plug user service with repository mapping
  user: plug(userCircuit, {
    repos: "database.repos",
  }),
  
  // Plug post service with repository mapping
  post: plug(postCircuit, {
    repos: "database.repos",
  }),
}, {});

// === Application Bootstrap (app.ts) ===
import { wireUp } from "wiremap";
import { appCircuit } from "./app/circuit.ts";

const app = wireUp(appCircuit);

// === Usage ===
async function main() {
  // Create a user
  const user = await app("user").service.createUser(
    "Alice", 
    "alice@example.com"
  );
  
  // Create a post for that user
  const post = await app("post").service.createPost(
    "My First Post",
    "Hello, world!",
    user.id
  );
  
  // Get user's posts
  const userPosts = app("post").service.getPostsByAuthor(user.id);
  
  console.log("User:", user);
  console.log("Post:", post);
  console.log("User posts:", userPosts);
}
```


### Shared Dependencies

Multiple circuits can plug into the same dependency:

```ts
const appCircuit = defineCircuit({
  database: databaseCircuit,
  auth: authCircuit,
  
  // Both user and post services need the database
  user: plug(userCircuit, {
    repos: "database.repos",
  }),
  
  post: plug(postCircuit, {
    repos: "database.repos",
  }),
  
  // Admin service needs both database and auth
  admin: plug(adminCircuit, {
    repos: "database.repos",
    authService: "auth.service",
  }),
}, {});
```
