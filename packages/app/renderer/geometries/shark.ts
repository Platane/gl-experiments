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
  } = await loadGLTFwithCache(model_glb, "Sharky");

  const { boneWeights, boneIndexes } = computeWeights(bindPose, positions);

  const geometry = {
    positions,
    normals: normals!,
    boneWeights,
    boneIndexes,
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
