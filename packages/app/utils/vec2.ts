import { vec2 } from "gl-matrix";

export const getFromArray2 = (arr: Float32Array, i: number) =>
  arr.subarray(i * 2, (i + 1) * 2);

export const copyFromArray2 = (out: vec2, arr: ArrayLike<number>, i: number) =>
  vec2.set(out, arr[i * 2 + 0], arr[i * 2 + 1]);

export const copyIntoArray2 = (
  arr: number[] | TypedArray,
  i: number,
  v: vec2,
) =>
  setIntoArray2(
    arr,
    i,

    v[0],
    v[1],
  );

export const setIntoArray2 = (
  arr: number[] | TypedArray,
  i: number,
  x: number,
  y: number,
) => {
  arr[i * 2 + 0] = x;
  arr[i * 2 + 1] = y;
};

export type TypedArray =
  | Int8Array
  | Uint8Array
  | Uint8ClampedArray
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Float32Array
  | Float64Array;
