# Wire Up

The `wireUp` function is the main bootstrap function in wiremap that creates the dependency injection container and returns a wire function for accessing blocks and units across your application. It handles both synchronous and asynchronous factory initialization automatically.

## Basic Usage

```ts
import { wireUp, defineCircuit } from "wiremap";

// Define a simple circuit
const appCircuit = defineCircuit({
  config: { port: 3000, host: "localhost" },
  
  $database: {
    connection: { url: "postgres://localhost:5432" },
    query: (sql: string) => console.log("Executing:", sql),
  },
}, {});

// Wire up the application
const app = wireUp(appCircuit);

// Access units
console.log(app().config.port); // 3000
app("database").query("SELECT * FROM users");
```

## Function Signature

```ts
function wireUp<C extends BulkCircuitDef>(
  circuit: C,
  inputs?: C["__inputs"]
): WiredUp<C>
```

### Parameters

- **`circuit`** - The circuit definition to wire up
- **`inputs`** (optional) - External inputs to provide to the circuit

### Return Type

The return type depends on whether the circuit contains async factories:

- **`InferWire<Circuit>`** - If no async factories exist (synchronous)
- **`Promise<InferWire<Circuit>>`** - If async factories exist (asynchronous)

## Synchronous vs Asynchronous

`wireUp` automatically detects whether your circuit contains async factories and adjusts its return type accordingly:

### Synchronous Circuit

```ts
const syncCircuit = defineCircuit({
  config: { port: 3000 },
  
  service: {
    getData: () => ["item1", "item2"],
  },
}, {});

// Returns immediately (no await needed)
const app = wireUp(syncCircuit);
const data = app("service").getData();
```

### Asynchronous Circuit

```ts
const asyncCircuit = defineCircuit({
  config: { port: 3000 },
  
  database: defineUnit(async () => {
    // Simulate database connection
    await new Promise(resolve => setTimeout(resolve, 100));
    return { query: (sql: string) => `Results for: ${sql}` };
  }, { is: "asyncFactory" }),
}, {});

// Returns Promise - must await
const app = await wireUp(asyncCircuit);
const results = app("database").query("SELECT * FROM users");
```

## Providing External Inputs

Use the second parameter to provide external inputs that your circuit requires:

```ts
import { defineCircuit, defineInputs, wireUp } from "wiremap";
import type { InferWire } from "wiremap";

type W = InferWire<typeof userCircuit, 'service'>

// Circuit that requires external inputs
const userCircuit = defineCircuit(
  {
    $service: {
      createUser: defineUnit(function (this: W, name: string, email: string) => {
        const db = this('database')
        const user = { id: crypto.randomUUID(), name, email };
        db.save(user);
        return user;
      }),
    },
  },
  defineInputs<{
    database: {
      save: (user: any) => Promise<void>;
    };
  }>()
);

// Wire up with external inputs
const app = wireUp(userCircuit, {
  database: {
    save: async (user) => console.log("Saving user:", user),
  },
});

const user = app("service").createUser("Alice", "alice@example.com");
```

## Access Patterns

Once wired up, the returned wire function provides several access patterns:

### Root Access

```ts
// Access root-level units
const config = app().config;
const database = app().database;
```

### Block Access

```ts
// Access specific blocks
const userService = app("user.service");
const dbConnection = app("database.connection");
```

## Error Handling

`wireUp` provides clear error messages for common issues:

### Missing Dependencies

```ts
const circuit = defineCircuit({
  service: {
    doSomething: (dep: any) => dep.work(),
  },
}, defineInputs<{
  dependency: { work: () => void };
}>());

// Error: Missing required input
try {
  const app = wireUp(circuit); // No inputs provided
} catch (error) {
  console.log(error.message); // Clear error about missing dependency
}
```

### Invalid Block Paths

```ts
const app = wireUp(simpleCircuit);

try {
  app("nonexistent.block"); // Invalid path
} catch (error) {
  console.log(error.message); // "Block 'nonexistent.block' not found"
}
```

## Type Safety

`wireUp` provides full type safety for both the circuit definition and the inputs:

```ts
interface DatabaseService {
  save: (data: any) => Promise<void>;
  find: (id: string) => Promise<any>;
}

const circuit = defineCircuit(
  {
    $service: {
      createUser: defineInput(async function(this: W, name: string)  {
        const db = this('database')
        const user = { id: crypto.randomUUID(), name };
        await db.save(user);
        return user;
      }, { is: 'bound' }),
    },
  },
  defineInputs<{
    $database: DatabaseService;
  }>()
);

// ✅ Type-safe - TypeScript validates input structure
const app = wireUp(circuit, {
  $database: {
    save: async (data) => console.log("Saving:", data),
    find: async (id) => ({ id, name: "Found" }),
  },
});

// ❌ TypeScript error - missing required methods
const badApp = wireUp(circuit, {
  $database: {
    save: async (data) => console.log("Saving:", data),
    // find: missing - TypeScript error!
  },
});
```

## Performance Considerations

### Lazy Initialization

Units are created only when first accessed:

```ts
const circuit = defineCircuit({
  expensiveService: defineUnit(() => {
    console.log("Creating expensive service...");
    return { /* expensive initialization */ };
  }),
}, {});

const app = wireUp(circuit);
// Service not created yet

console.log("Accessing service...");
const service = app("expensiveService");
// "Creating expensive service..." - now it's created
```

### Caching

Once created, units are cached and reused:

```ts
let creationCount = 0;

const circuit = defineCircuit({
  counter: defineUnit(() => {
    creationCount++;
    return { count: creationCount };
  }),
}, {});

const app = wireUp(circuit);

console.log(app("counter").count); // 1
console.log(app("counter").count); // 1 (same instance)
console.log(app("counter").count); // 1 (same instance)
```
