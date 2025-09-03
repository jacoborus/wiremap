import { type Hashmap, unitSymbol } from "./common.ts";
import {
  isUnitDef,
  isBoundFunc,
  isBoundDef,
  isFactoryFunc,
  isFactoryDef,
  // isAsyncFactoryFunc, // TODO
  // isAsyncFactoryDef, // TODO
} from "./unit.ts";
import type { InferUnitValue } from "./unit.ts";

function fakeWire<F extends Hashmap>(fakeBlocks: F) {
  return function <P extends "" | keyof F>(blockPath = "" as P) {
    return fakeBlocks[blockPath];
  };
}

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
export function mockUnit<T>(def: T, fakeBlocks: Hashmap): InferUnitValue<T> {
  const wire = fakeWire(fakeBlocks);

  if (isUnitDef(def)) {
    if (isFactoryDef(def)) {
      const defValue = def[unitSymbol];
      return defValue(wire) as InferUnitValue<T>;
    }

    if (isBoundDef(def)) {
      const defValue = def[unitSymbol];
      return defValue.bind(wire) as InferUnitValue<T>;
    }

    return def[unitSymbol] as InferUnitValue<T>;
  }

  if (isBoundFunc(def)) {
    return def.bind(wire) as InferUnitValue<T>;
  }

  if (isFactoryFunc(def)) {
    return def(wire) as InferUnitValue<T>;
  }

  return def as InferUnitValue<T>;
}
