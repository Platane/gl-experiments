import { loadGLTFwithCache } from "../../../gltf-parser/loadGLTF";
import { computeWeights } from "../../utils/bones";

import model_glb from "../../assets/models/Sharky.glb?url";
import { getFlatShadingNormals } from "../../utils/geometry-normals";

export enum sharkAnimation {
  run = 9,
  idle = 3,
  death = 0,
}

export const getSharkModel = async () => {
  const {
    normals,
    positions,
    bindPose,
    animations,
    colorCount,
    colorIndexes,
    colorPalette,
    boneIndexes,
    boneWeights,
  } = await loadGLTFwithCache(model_glb, "Sharky");

  // const { boneWeights, boneIndexes } = computeWeights(bindPose, positions);

  const geometry = {
    positions,
    normals: normals!,
    // normals: getFlatShadingNormals(positions),
    boneWeights: boneWeights!,
    boneIndexes: new Uint8Array(boneIndexes!),
    boneCount: bindPose.length,
    colorCount: colorCount!,
    colorIndexes: colorIndexes!,
  };

  return {
    geometry,
    animations,

    // biome-ignore format: better
    colorPalettes: new Uint8Array([

      178, 146, 212,
      128, 100, 169,
      121, 120, 84,
      91, 96, 75,
      214, 167, 78,
      122, 47, 42,
      194, 181, 162,
      40, 40, 40,

      186, 188, 222,
      120, 128, 169,
      131, 119, 94,
      91, 76, 45,
      214, 167, 78,
      122, 47, 42,
      194, 181, 162,
      34, 34, 34,

      166, 158, 202,
      120, 128, 169,
      131, 119, 94,
      91, 76, 45,
      214, 167, 78,
      122, 47, 42,
      194, 181, 162,
      34, 34, 34,

      //
      ...colorPalette!,
    ]),

    bindPose,
  };
};
