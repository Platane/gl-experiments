import { mat4 } from "gl-matrix";
import { loadGLTF, loadGLTFwithCache } from "../../../gltf-parser";
import { getFlatShadingNormals } from "../../utils/geometry-normals";
import { computeWeights } from "../../utils/bones";

export const colorPalettes = [
  [
    [0.5, 0.5, 0.5],
    [0.8, 0.4, 0.5],
    [1, 0.5, 0.5],
  ],
  [
    [0.4, 0.5, 0.5],
    [0.86, 0.1, 0.6],
    [1, 0.1, 0.8],
  ],
  [
    [0.4, 0.5, 0.5],
    [0.4, 0.7, 0.1],
    [0.5, 0.8, 0.1],
  ],
  [
    [0.4, 0.5, 0.5],
    [0.4, 0.1, 0.55],
    [0.5, 0.1, 0.7],
  ],
  [
    [0.4, 0.5, 0.5],
    [0.8, 0.2, 0.2],
    [1.0, 0.2, 0.2],
  ],
  [
    [0.4, 0.5, 0.5],
    [0.2, 0.8, 0.1],
    [0.3, 1.0, 0.2],
  ],
] as [number, number, number][][];

const glb_url =
  "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/refs/heads/main/2.0/Fox/glTF-Binary/Fox.glb";

export const getGeometry = async () => {
  const { positions, bindPose, animations } = await loadGLTFwithCache(
    glb_url,
    "fox",
  );

  const normals = getFlatShadingNormals(positions);

  const { boneWeights, boneIndexes } = computeWeights(bindPose, positions);

  const colorIndexes = new Uint8Array(
    Array.from({ length: positions.length / 9 }, (_, i) => {
      const ya = positions[i * 9 + 0 + 1];
      const yb = positions[i * 9 + 3 + 1];
      const yc = positions[i * 9 + 6 + 1];

      const ym = (ya + yb + yc) / 3;

      if (ym < 20) return [0, 0, 0];
      if (ym < 50) return [1, 1, 1];
      return [2, 2, 2];
    }).flat(),
  );
  return {
    positions,
    normals,
    boneWeights,
    boneIndexes,
    colorIndexes,

    animations,
  };
};
