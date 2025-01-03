import { mat4 } from "gl-matrix";
import { loadGLTF } from "../../../gltf-parser";
import { getFlatShadingNormals } from "../../utils/geometry-normals";
import { computeWeights } from "../../utils/bones";

import triceratop_model_uri from "@gl/model-builder/model.glb?url";

const bindPose = [mat4.create(), mat4.create()];
mat4.fromTranslation(bindPose[0], [0, 0, 0]);
mat4.fromTranslation(bindPose[1], [-1, 0, 0]);

const secondPose = [mat4.create(), mat4.create()];
mat4.fromYRotation(secondPose[0], -Math.PI / 3);
mat4.fromTranslation(secondPose[1], [-0.98, 0, 0]);

const thirdPose = [mat4.create(), mat4.create()];
mat4.fromZRotation(thirdPose[0], 0.4);
mat4.fromTranslation(thirdPose[1], [-1, 0, 0]);

export const poses = [bindPose, secondPose, thirdPose];

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
  const { positions } = await loadGLTF(triceratop_model_uri, "triceratops");

  for (let i = 0; i < positions.length; i += 3) {
    positions[i + 0] /= 20;
    positions[i + 1] /= 20;
    positions[i + 1] += 0.365;
    positions[i + 2] /= 20;
  }

  const normals = getFlatShadingNormals(positions);

  const { boneWeights, boneIndexes } = computeWeights(bindPose, positions);

  const colorIndexes = new Uint8Array(
    Array.from({ length: positions.length / 3 }, (_, i) => {
      const y = positions[i * 3 + 1];

      if (y < 0.08) return 0;
      if (y < 0.25) return 1;
      return 2;
    }),
  );
  return { positions, normals, boneWeights, boneIndexes, colorIndexes };
};
