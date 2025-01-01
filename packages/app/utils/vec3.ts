import { vec3 } from "gl-matrix";

export const UP: vec3 = [0, 1, 0];
export const ZERO: vec3 = [0, 0, 0];

/**
 * set from an array of vec3
 */
export const copyFromArray3 = (out: vec3, arr: ArrayLike<number>, i: number) =>
  vec3.set(out, arr[i * 3 + 0], arr[i * 3 + 1], arr[i * 3 + 2]);

export const copyIntoArray3 = (
  arr: number[] | TypedArray,
  i: number,
  v: vec3,
) =>
  setIntoArray3(
    arr,
    i,

    v[0],
    v[1],
    v[2],
  );

export const setIntoArray3 = (
  arr: number[] | TypedArray,
  i: number,
  x: number,
  y: number,
  z: number,
) => {
  arr[i * 3 + 0] = x;
  arr[i * 3 + 1] = y;
  arr[i * 3 + 2] = z;
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
