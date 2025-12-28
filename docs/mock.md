# Mock unit

Wiremap includes built-in utilities to make testing easy and reliable. Because blocks and units are fully compositional, you can swap out real implementations
with mocks, stubs, or fakes, ensuring tests stay isolated and predictable.

The `mockUnit` helper lets you replace the dependencies of a unit under test with controlled fake values. This way you can test logic in complete isolation, without touching databases, APIs, or other external systems.

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
      name: "john",
      email: "john@example.com",
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

This allows you to test the business logic of your unit without depending on real infrastructure. By controlling the wire through fake blocks, you can precisely simulate the environment needed for each test case.
