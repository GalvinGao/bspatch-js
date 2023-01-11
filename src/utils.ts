// little-endian
export function int64FromU8Array(array: Uint8Array): number {
  const result =
    ((array[0] & 0xff) << (0 * 8)) |
    ((array[1] & 0xff) << (1 * 8)) |
    ((array[2] & 0xff) << (2 * 8)) |
    ((array[3] & 0xff) << (3 * 8)) |
    ((array[4] & 0xff) << (4 * 8)) |
    ((array[5] & 0xff) << (5 * 8)) |
    ((array[6] & 0xff) << (6 * 8)) |
    ((array[7] & 0x7f) << (7 * 8));
  const signed = (array[7] & 0x80) != 0;
  return signed ? -result : result;
}

export function truncateBigInt(b: bigint): number {
  if (b > Number.MAX_SAFE_INTEGER) {
    throw new Error("bigint too large: " + b.toString());
  }
  return Number(b);
}
