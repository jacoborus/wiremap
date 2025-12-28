# Wiremap intro

Wiremap lets you compose apps from small **units** grouped into **blocks**, all wired together with predictable types. You define data and behaviors as units, cluster them into blocks, and wire them up to get a ready-to-use object graph.

## Minimal example
```ts
import { defineUnit, tagBlock, wireUp, InferWire } from "wiremap";

type W = InferWire<typeof circuit>
const app = {
  $: tagBlock(),
  name: "Ada",
  greet: defineUnit(
    function (this: W) {
      return `Hello ${this('.').name}`
    },
    { is: 'bound' }
  ),
};

const wire = await wireUp(app);

console.log(wire().greet()); // Hello Ada
```
