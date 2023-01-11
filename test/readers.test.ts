import { assert, describe, it } from "vitest";
import { readHeader } from "../src/index";

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

describe("partial readers", () => {
  it("should correctly read a designated bsdiff40 header", async () => {
    const HEADER = new Uint8Array([
      0x42,
      0x53,
      0x44,
      0x49,
      0x46,
      0x46,
      0x34,
      0x30, // BSDIFF40
      0x18,
      0x3a,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00, // ctrlLen, dec(14872), hex(3a18); int64 in little-endian
      0x0c,
      0x0e,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00, // diffLen, dec(3596), hex(0e0c); int64 in little-endian
      0x0a,
      0x8f,
      0x74,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00, // newLen, dec(7638794), hex(748f0a); int64 in little-endian
    ]);

    const parsed = readHeader(HEADER);
    assert.equal(parsed.ctrlLen, 14872);
    assert.equal(parsed.diffLen, 3596);
    assert.equal(parsed.newLen, 7638794);
  });
});
