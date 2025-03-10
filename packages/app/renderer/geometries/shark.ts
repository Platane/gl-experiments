import { loadGLTFwithCache } from "../../../gltf-parser/loadGLTF";
import { computeWeights } from "../../utils/bones";

import model_glb from "../../assets/models/Sharky.glb?url";

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
    boneWeights: boneWeights!,
    boneIndexes: new Uint8Array(boneIndexes!),
    boneCount: bindPose.length,
    colorCount: colorCount!,
    colorIndexes: colorIndexes!,
  };

  return {
    geometry,
    animations,
    colorPalettes: colorPalette!,

    bindPose,
  };
};
