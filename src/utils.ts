// little-endian
export function bigInt64FromU8Array(array: Uint8Array): bigint {
  const result =
    (BigInt(array[0] & 0xff) << BigInt(0 * 8)) |
    (BigInt(array[1] & 0xff) << BigInt(1 * 8)) |
    (BigInt(array[2] & 0xff) << BigInt(2 * 8)) |
    (BigInt(array[3] & 0xff) << BigInt(3 * 8)) |
    (BigInt(array[4] & 0xff) << BigInt(4 * 8)) |
    (BigInt(array[5] & 0xff) << BigInt(5 * 8)) |
    (BigInt(array[6] & 0xff) << BigInt(6 * 8)) |
    (BigInt(array[7] & 0x7f) << BigInt(7 * 8));
  const signed = (array[7] & 0x80) != 0;
  return signed ? -result : result;
}

export function truncateBigInt(b: bigint): number {
  if (b > Number.MAX_SAFE_INTEGER) {
    throw new Error("bigint too large: " + b.toString());
  }
  return Number(b);
}
