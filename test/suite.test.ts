import { assert, describe, it } from "vitest";
import { bspatch } from "../src";
import { readTestData } from "./utils";

async function bufferEqual(buffer1: ArrayBuffer, buffer2: ArrayBuffer) {
  const bytes1 = new Uint8Array(buffer1);
  const bytes2 = new Uint8Array(buffer2);
  if (bytes1.length !== bytes2.length) {
    throw new Error("buffers have different lengths");
  }
  for (let i = 0; i < bytes1.length; i++) {
    if (bytes1[i] !== bytes2[i]) {
      throw new Error(
        `buffers differ at index ${i}: ${bytes1[i]} !== ${bytes2[i]}`
      );
    }
  }
}

describe("existing test data cases", () => {
  it("should successfully patch stages", async () => {
    const cas = "stages";
    const base = await readTestData(cas + ".base");
    const patch = await readTestData(cas + ".patchgz");
    const expected = await readTestData(cas + ".expected");

    console.time("patch");
    const actual = await bspatch(base, patch);
    console.timeEnd("patch");

    assert.equal(actual.byteLength, expected.byteLength, "byte length");
    try {
      await bufferEqual(actual, expected);
    } catch (e) {
      assert.fail(e.message);
    }
  });
});
