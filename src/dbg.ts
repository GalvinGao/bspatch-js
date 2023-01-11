import fs from "fs/promises";
import path from "path";
import { bspatch } from "../src";

const TEST_CASE = "stages";
function readTest(suffix: string) {
  return fs.readFile(
    path.resolve(__dirname, "../test/testdata", TEST_CASE + "." + suffix)
  );
}

async function main() {
  const base = await readTest("base");
  const patch = await readTest("patchgz");

  for (let i = 0; i < 1000000; i++) {
    await bspatch(base, patch);
    console.log(i);
  }
}

main()
  .then(() => console.log())
  .catch((e) => console.error(e))
  .finally(() => {
    console.log("done");
    process.exit(0);
  });
