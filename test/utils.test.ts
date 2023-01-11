import { assert, describe, it } from "vitest";
import { int64FromU8Array } from "../src/utils";

describe("bigInt64FromU8Array", () => {
  it("should correctly retrieve int64 (signed) from a Uint8Array with a given offset", async () => {
    const array = new Uint8Array([
      0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ]);
    const result = int64FromU8Array(array);
    assert.equal(result, 1);
  });
});
