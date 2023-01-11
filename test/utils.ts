import fs from "fs/promises";
import path from "path";

export const readTestData = async (p: string): Promise<ArrayBuffer> => {
  return (await fs.readFile(path.resolve(__dirname, "testdata", p))).buffer;
};
