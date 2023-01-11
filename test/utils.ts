import fs from "fs/promises";
import path from "path";

export const readTestData = async (p: string): Promise<Uint8Array> => {
  return new Uint8Array(
    (await fs.readFile(path.resolve(__dirname, "testdata", p))).buffer
  );
};
