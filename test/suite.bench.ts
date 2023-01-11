import { beforeAll, bench, describe } from "vitest";
import { bspatch } from "../src";
import { readTestData } from "./utils";

const TEST_CASE = "stages";

let base: ArrayBuffer;
let patch: ArrayBuffer;
let expected: ArrayBuffer;

beforeAll(async () => {
  base = await readTestData(TEST_CASE + ".base");
  patch = await readTestData(TEST_CASE + ".patchgz");
  expected = await readTestData(TEST_CASE + ".expected");
});

describe("existing test data cases", () => {
  bench("stages", async () => {
    await bspatch(base, patch);
  });
});
