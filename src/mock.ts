import type { Hashmap } from "./common.ts";
import type { InferUnitValue, IsAsyncFactory } from "./unit.ts";

import { unitSymbol } from "./common.ts";
import {
  isAsyncFactoryDef,
  isAsyncFactoryFunc,
  isBoundDef,
  isBoundFunc,
  isFactoryDef,
  isFactoryFunc,
  isUnitDef,
} from "./unit.ts";

function fakeWire<F extends Hashmap>(fakeBlocks: F) {
  return function <P extends "" | keyof F>(blockPath = "" as P) {
    return fakeBlocks[blockPath];
  };
}

type Mocked<T> =
  IsAsyncFactory<T> extends true
    ? Promise<InferUnitValue<T>>
    : InferUnitValue<T>;

/**
 * Creates a mock instance of a unit for testing with controlled fake dependencies.
 *
 * Essential for unit testing as it allows testing individual units in isolation by providing
 * controlled fake dependencies instead of wiring the entire application. This enables fast,
 * deterministic tests without external dependencies like databases or APIs.
 *
 * @template T - The unit definition type
 * @param def - The unit definition to mock (can be any unit type: factory, bound, plain, etc.)
 * @param fakeBlocks - Object containing fake block dependencies for testing, keyed by block path
 * @returns Mocked unit instance with proper typing
 *
 * @example Cross-module dependency testing
 * ```typescript
 * import { mockUnit } from "wiremap";
 * import * as postService from "./postService.ts";
 *
 * const fakeBlocks = {
 *   "..": { repo: [] },                // Parent block (post) with in-memory repo
 *   "user.service": {                  // Mock external dependency
 *     getUser: (id: string) => ({
 *       id,
 *       name: "test-user",
 *       email: "test@example.com",
 *       isAdmin: true
 *     })
 *   }
 * };
 *
 * const addPost = mockUnit(postService.addPost, fakeBlocks);
 * const getPost = mockUnit(postService.getPost, fakeBlocks);
 *
 * const postId = addPost("Test Title", "Test Content", "user123");
 * const post = getPost(postId);
 *
 * assertEquals(post.title, "Test Title");
 * ```
 *
 * @example Local block mocking
 * ```typescript
 * const fakeBlocks = {
 *   user: { repo: [] },                    // Parent user block
 *   ".": {                                 // Local block (user.service)
 *     getUserByEmail: (email: string) => {
 *       return repo.find((user) => user.email === email);
 *     }
 *   }
 * };
 *
 * const addUser = mockUnit(userService.addUser, fakeBlocks);
 * addUser("john", "john@example.com", true);
 * ```
 *
 * @example Mocking different unit types
 * ```typescript
 * // Factory unit
 * const mockService = mockUnit(
 *   defineUnit(
 *     (wire) => new Service(wire().db),
 *     { isFactory: true }
 *   ),
 *   fakeBlocks
 * );
 *
 * // Bound unit
 * const mockHandler = mockUnit(
 *   defineUnit(function(this: Wire) { return this().db; }, { isBound: true }),
 *   fakeBlocks
 * );
 * ```
 *
 * @example Block path reference guide
 * ```typescript
 * // From context "post.service":
 * {
 *   "": rootBlock,           // Root block
 *   ".": localBlock,         // Current block (post.service)
 *   "..": parentBlock,       // Parent block (post)
 *   "user.service": otherBlock,  // Absolute block path
 *   ".repository": childBlock    // Child block (post.service.repository)
 * }
 * ```
 *
 * @public
 * @since 1.0.0
 */
export function mockUnit<T>(def: T, fakeBlocks: Hashmap): Mocked<T> {
  const wire = fakeWire(fakeBlocks);

  if (isUnitDef(def)) {
    if (isFactoryDef(def)) {
      const defValue = def[unitSymbol];
      return defValue(wire) as Mocked<T>;
    }

    if (isBoundDef(def)) {
      const defValue = def[unitSymbol];
      return defValue.bind(wire) as Mocked<T>;
    }

    if (isAsyncFactoryDef(def)) {
      const defValue = def[unitSymbol];
      return defValue(wire) as Mocked<T>;
    }

    return def[unitSymbol] as Mocked<T>;
  }

  if (isBoundFunc(def)) {
    return def.bind(wire) as Mocked<T>;
  }

  if (isFactoryFunc(def)) {
    return def(wire) as Mocked<T>;
  }

  if (isAsyncFactoryFunc(def)) {
    return def(wire) as Mocked<T>;
  }

  return def as Mocked<T>;
}
