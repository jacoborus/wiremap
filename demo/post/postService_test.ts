import { assertEquals } from "@std/assert";

import { mockUnit } from "../../src/mock.ts";

import type { Post } from "./postRepo.ts";
import * as postService from "./postService.ts";

Deno.test("addPostTest", function addPostTest() {
  const repo = [] as Post[];
  const fakeBlocks = {
    "..": { repo },
    "user.service": {
      getUser: (id: string) => ({
        id,
        name: "jacobo",
        email: "asdfasdf@qfasdfasd.asdf",
        isAdmin: true,
      }),
    },
  };

  const addPost = mockUnit(postService.addPost, fakeBlocks);
  const getPost = mockUnit(postService.getPost, fakeBlocks);

  const postId = addPost("titulo", "contenido", "11234");
  const post = getPost(postId);

  if (!post) throw new Error("Post not found");

  assertEquals(post.id, postId);
  assertEquals(post.title, "titulo");
  assertEquals(post.content, "contenido");
  assertEquals(post.userId, "11234");
});
