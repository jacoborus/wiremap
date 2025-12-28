# Unit

Units are the smallest building blocks of your app.
They can hold any value and are resolved lazily (on demand) and cached.
To define a unit, add it to a block, either directly or with `defineUnit`.

```ts
import { defineUnit, tagBlock } from "wiremap";

export const $ = tagBlock();

// direct unit
export const port = 3000;
export const myFunc = function () {};

// using the helper
export const myUnit = defineUnit(function () {});
```

👉 Use `as const` to ensure TypeScript infers precise literal types (e.g. `true`
instead of `boolean`).

---

## Private units

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

## Factory units

Factory units are functions that take the **wire** as their first argument and
return the unit.
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

## Async factory units

Async factories return a Promise.\
When async factories exist, `wireUp()` returns a Promise that resolves once everything is initialized and ready.

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

## Bound units

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

