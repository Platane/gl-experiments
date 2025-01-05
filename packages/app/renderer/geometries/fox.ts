import { mat4 } from "gl-matrix";
import { loadGLTF } from "../../../gltf-parser";
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

export const getGeometry = async () => {
  const { positions, bindPose, animations } = await loadGLTF(
    "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/refs/heads/main/2.0/Fox/glTF-Binary/Fox.glb",
    "fox",
  );

  const normals = getFlatShadingNormals(positions);

  const { boneWeights, boneIndexes } = computeWeights(bindPose, positions);

  const colorIndexes = new Uint8Array(
    Array.from({ length: positions.length / 3 }, (_, i) => {
      const y = positions[i * 3 + 1];

      if (y < 20) return 0;
      if (y < 50) return 1;
      return 2;
    }),
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
