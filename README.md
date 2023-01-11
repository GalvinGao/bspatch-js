# `bspatch`

> **Warning**
>
> This project is NOT an exact implementation that complies with the bsdiff4 format used in [Colin Percival's bsdiff/bspatch binary](https://www.daemonology.net/bsdiff/).
>
> Colin Percival (and many others) uses bzip2 as the compression algorithm, however it is too slow and I can't find a decent JS implementation that satisfies the tradeoff between binary size & speed. Thus, in this particular implementation gzip (inflate) is used instead.

## Usage

```ts
bspatch(
  old: Uint8Array,
  patch: Uint8Array
): Promise<Uint8Array>
```

Deadly simple. Just pass in the old file and the patch file, and you'll get the new file.

## Test

```
 ✓ test/utils.test.ts (1)
 ✓ test/readers.test.ts (1)
 ✓ test/suite.test.ts (1)

  Snapshots  1 obsolete
             ↳ test/suite.test.ts
               · suite name > snapshot 1

 Test Files  3 passed (3)
      Tests  3 passed (3)
   Start at  05:33:43
   Duration  631ms (transform 288ms, setup 0ms, collect 112ms, tests 54ms)
```

## Performance

```
 ✓ test/suite.bench.ts (1) 635ms
   ✓ existing test data cases (1) 632ms
     name        hz     min     max    mean     p75     p99    p995    p999     rme  samples
   · stages  163.39  5.3894  9.7867  6.1204  6.1873  9.7867  9.7867  9.7867  ±2.92%       82   fastest
```

## License

MIT
