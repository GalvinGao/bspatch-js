import { int64FromU8Array } from "./utils";
// decompress has the signature of function decompress(): through.ThroughStream
import { gunzipSync } from "fflate";

const MAGIC = "BSDIFF40";
const HEADER_SIZE = 32;
const CONTROL_SIZE = 24;

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
    ctrlLen: int64FromU8Array(array.slice(8, 16)),
    diffLen: int64FromU8Array(array.slice(16, 24)),
    newLen: int64FromU8Array(array.slice(24, 32)),
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
    bytesFromDiffBlock: int64FromU8Array(array.slice(0, 8)),
    bytesFromExtraBlock: int64FromU8Array(array.slice(8, 16)),
    seekInInput: int64FromU8Array(array.slice(16, 24)),
  };
}

async function decompressU8Array(array: ArrayBuffer): Promise<Uint8Array> {
  return gunzipSync(new Uint8Array(array));
}

export async function bspatch(
  oldBytes: Uint8Array,
  patch: Uint8Array
): Promise<Uint8Array> {
  const header = readHeader(patch);

  const controlBlockEnd = HEADER_SIZE + header.ctrlLen;
  const diffBlockEnd = controlBlockEnd + header.diffLen;
  const extraBlockEnd = patch.byteLength;

  const compressedControlBlock = patch.slice(HEADER_SIZE, controlBlockEnd);
  const compressedDiffBlock = patch.slice(controlBlockEnd, diffBlockEnd);
  const compressedExtraBlock = patch.slice(diffBlockEnd, extraBlockEnd);

  // decompress blocks
  const controlBlock = await decompressU8Array(compressedControlBlock);
  const diffBlock = await decompressU8Array(compressedDiffBlock);
  const extraBlock = await decompressU8Array(compressedExtraBlock);

  const newBytes = new Uint8Array(header.newLen);

  // offsets
  let newPos = 0;
  let oldPos = 0;
  let ctrlPos = 0;
  let diffPos = 0;
  let extraPos = 0;

  // apply patch
  while (newPos < header.newLen) {
    const control = readControl(
      controlBlock.slice(ctrlPos, ctrlPos + CONTROL_SIZE)
    );
    ctrlPos += CONTROL_SIZE;

    if (
      newPos + control.bytesFromDiffBlock > header.newLen ||
      control.bytesFromDiffBlock < 0
    ) {
      throw new Error("invalid patch");
    }

    // copy bytes from diff block
    newBytes.set(
      diffBlock.slice(diffPos, diffPos + control.bytesFromDiffBlock),
      newPos
    );

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
    newBytes.set(
      extraBlock.slice(extraPos, extraPos + control.bytesFromExtraBlock),
      newPos
    );

    newPos += control.bytesFromExtraBlock;
    oldPos += control.seekInInput;
    extraPos += control.bytesFromExtraBlock;
  }

  return newBytes;
}
