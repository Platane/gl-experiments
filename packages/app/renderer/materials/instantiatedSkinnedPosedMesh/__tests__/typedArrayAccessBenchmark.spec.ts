import { expect, it } from "bun:test";

const processRowIndex = (
  output: Float32Array,
  i: number,
  input: Float32Array,
) => {
  output[i * 2 + 0] = input[i * 2 + 0] + 10;
  output[i * 2 + 1] = input[i * 2 + 1] + 20;
};
const processRow = (output: Float32Array, input: Float32Array) => {
  output[0] = input[0] + 10;
  output[1] = input[1] + 20;
};

const runBench = (step: () => void) => {
  let startDate = performance.now();
  let blockSize = 0;
  while (performance.now() - startDate < 200) {
    step();
    blockSize++;
  }

  const endDates = [];

  while (performance.now() - startDate < 1_000) {
    for (let k = blockSize; k--; ) step();
    endDates.push(performance.now());
  }
  const durations = endDates.map((d, i, arr) => d - (arr[i - 1] ?? startDate));

  // remove the first ones, as it's likely not jit optimized ? ( idk what I am doing )
  durations.slice(0, 2);

  // take the 5 worsts
  const worstDurations = durations
    .slice()
    .sort((a, b) => b - a)
    .slice(0, 5);

  const meanWorstDuration =
    worstDurations.reduce((sum, x) => sum + x, 0) / worstDurations.length;

  return {
    meanOperationDurationMs: meanWorstDuration / blockSize,
    blockSize,
    blockRunCount: durations.length,
    blockRunDuration: durations,
  };
};

export const runBenchmark = () => {
  const N = 100_000;
  const output = new Float32Array(N * 2);
  const input = new Float32Array(N * 2);

  const withIndex = runBench(() => {
    for (let i = N; i--; ) {
      processRowIndex(output, i, input);
    }
  });

  const withSubArray = runBench(() => {
    for (let i = N; i--; ) {
      const o = output.subarray(i * 2, i * 2 + 2);
      const ii = input.subarray(i * 2, i * 2 + 2);
      processRow(o, ii);
    }
  });

  const withNewTypedArray = runBench(() => {
    for (let i = N; i--; ) {
      const o = new Float32Array(output.buffer, i * 2 * 4, 2);
      const ii = new Float32Array(input.buffer, i * 2 * 4, 2);
      processRow(o, ii);
    }
  });

  let proxyOutputOffset = 8;
  const proxyOutput = new Proxy(output, {
    get: (o, property) => o[+(property as any) + proxyOutputOffset],
    set: (o, property, value) =>
      Reflect.set(o, +(property as any) + proxyOutputOffset, value),
  });

  proxyOutput[0] = 9;

  const withProxyMagic = runBench(() => {
    for (let i = N; i--; ) {
      proxyOutputOffset = i * 2;
      processRow(proxyOutput, input);
    }
  });

  console.log(
    Object.entries({
      //
      withIndex,
      withSubArray,
      withNewTypedArray,
      withProxyMagic,
    })
      .sort(
        (a, b) => a[1].meanOperationDurationMs - b[1].meanOperationDurationMs,
      )
      .map(
        ([name, { meanOperationDurationMs, blockSize, blockRunCount }]) =>
          `${name.padEnd(20, " ")}: ${meanOperationDurationMs.toFixed(2).padStart(6, " ")} ms/operation (blockSize: ${blockSize}, run: ${blockSize * blockRunCount})`,
      )
      .join("\n"),
  );
};
