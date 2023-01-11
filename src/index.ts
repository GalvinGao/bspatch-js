import { bigInt64FromU8Array, truncateBigInt } from "./utils";
// decompress has the signature of function decompress(): through.ThroughStream
import { gunzipSync } from "fflate";

const MAGIC = "BSDIFF40";

interface BsdiffHeader {
  magic: string;
  ctrlLen: number;
  diffLen: number;
  newLen: number;
}

export function readHeader(array: Uint8Array): BsdiffHeader {
  // BSDIFF40 header format:
  // 0x00 8 bytes asciistring "BSDIFF40"
  // 0x08 8 bytes little-endian integer ctrlLen
  // 0x10 8 bytes little-endian integer diffLen
  // 0x18 8 bytes little-endian integer extraLen
  const magic = new TextDecoder().decode(array.slice(0, 8));

  if (magic !== MAGIC) {
    throw new Error("invalid magic");
  }

  return {
    magic,
    ctrlLen: truncateBigInt(bigInt64FromU8Array(array.slice(8, 16))),
    diffLen: truncateBigInt(bigInt64FromU8Array(array.slice(16, 24))),
    newLen: truncateBigInt(bigInt64FromU8Array(array.slice(24, 32))),
  };
}

interface BsdiffControlBlock {
  bytesFromDiffBlock: number;
  bytesFromExtraBlock: number;
  seekInInput: number;
}

function readControl(array: Uint8Array): BsdiffControlBlock {
  // Control block format:
  // 0x00 8 bytes little-endian integer bytesFromDiffBlock
  // 0x08 8 bytes little-endian integer bytesFromExtraBlock
  // 0x16 8 bytes little-endian integer seekInInput
  return {
    bytesFromDiffBlock: truncateBigInt(bigInt64FromU8Array(array.slice(0, 8))),
    bytesFromExtraBlock: truncateBigInt(
      bigInt64FromU8Array(array.slice(8, 16))
    ),
    seekInInput: truncateBigInt(bigInt64FromU8Array(array.slice(16, 24))),
  };
}

async function decompressU8Array(array: ArrayBuffer): Promise<Uint8Array> {
  return gunzipSync(new Uint8Array(array));
}

function add(left: Uint8Array, right: Uint8Array, offset: number, end: number) {
  for (let i = offset; i < end; i++) {
    left[i] += right[i];
  }

  return left;
}

function rolloverByte(n: number): number {
  return n & 0xff;
}

export async function bspatch(
  old: ArrayBuffer,
  patch: ArrayBuffer
): Promise<ArrayBuffer> {
  const header = readHeader(new Uint8Array(patch));

  const compressedControlBlock = patch.slice(32, 32 + header.ctrlLen);
  const compressedDiffBlock = patch.slice(
    32 + header.ctrlLen,
    32 + header.ctrlLen + header.diffLen
  );
  const compressedExtraBlock = patch.slice(
    32 + header.ctrlLen + header.diffLen,
    patch.byteLength
  );

  // decompress control block
  console.time("decompress control block");
  const controlBlock = await decompressU8Array(compressedControlBlock);
  console.timeEnd("decompress control block");
  console.log(
    "control block: original size",
    compressedControlBlock.byteLength,
    "decompressed size",
    controlBlock.byteLength
  );

  // decompress diff block
  console.time("decompress diff block");
  const diffBlock = await decompressU8Array(compressedDiffBlock);
  console.timeEnd("decompress diff block");
  console.log(
    "diff block: original size",
    compressedDiffBlock.byteLength,
    "decompressed size",
    diffBlock.byteLength
  );

  // decompress extra block
  console.time("decompress extra block");
  const extraBlock = await decompressU8Array(compressedExtraBlock);
  console.timeEnd("decompress extra block");
  console.log(
    "extra block: original size",
    patch.byteLength - (32 + header.ctrlLen + header.diffLen),
    "decompressed size",
    extraBlock.byteLength
  );

  const oldBytes = new Uint8Array(old);
  const newBytes = new Uint8Array(header.newLen);

  // apply patch
  let newPos = 0;
  let oldPos = 0;
  let ctrlPos = 0;
  let diffPos = 0;
  let extraPos = 0;
  while (newPos < header.newLen) {
    const control = readControl(controlBlock.slice(ctrlPos, ctrlPos + 24));
    ctrlPos += 24;

    if (
      newPos + control.bytesFromDiffBlock > header.newLen ||
      control.bytesFromDiffBlock < 0
    ) {
      throw new Error("invalid patch");
    }

    // copy bytes from diff block
    for (let i = 0; i < control.bytesFromDiffBlock; i++) {
      const readPos = newPos + i;
      newBytes[readPos] = diffBlock[diffPos + i];
    }

    // rewrite "copy bytes from diff block" using a better performance approach:
    // newBytes.set(
    //   diffBlock.slice(diffPos, diffPos + control.bytesFromDiffBlock),
    //   newPos
    // );

    diffPos += control.bytesFromDiffBlock;

    // add oldBytes to diff string
    for (let i = 0; i < control.bytesFromDiffBlock; i++) {
      if (oldPos + i >= 0 && oldPos + i < oldBytes.length) {
        newBytes[newPos + i] += oldBytes[oldPos + i];
      }
    }

    newPos += control.bytesFromDiffBlock;
    oldPos += control.bytesFromDiffBlock;

    if (newPos + control.bytesFromExtraBlock > header.newLen) {
      throw new Error("invalid patch");
    }

    // copy bytes from extra block
    for (let i = 0; i < control.bytesFromExtraBlock; i++) {
      const readPos = newPos + i;
      newBytes[readPos] = extraBlock[extraPos + i];
    }

    newPos += control.bytesFromExtraBlock;
    oldPos += control.seekInInput;
    extraPos += control.bytesFromExtraBlock;
  }

  return newBytes.buffer;
}
