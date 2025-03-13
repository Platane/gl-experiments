import { loadGLTFwithCache } from "../../../gltf-parser/loadGLTF";
import { getFlatShadingNormals } from "../../utils/geometry-normals";

// import model_glb from "../../assets/models/Sharky.glb?url";
const model_glb =
  "https://raw.githubusercontent.com/platane/gl-experiments/assets/Sharky.glb";

export const getSharkModel = async () => {
  const {
    normals,
    positions,
    bindPose,
    animations: animations_,
    colorCount,
    colorIndexes,
    colorPalette,
    boneIndexes,
    boneWeights,
  } = await loadGLTFwithCache(model_glb, "Sharky");

  // const { boneWeights, boneIndexes } = computeWeights(bindPose, positions);

  const geometry = {
    positions,
    // normals: normals!,
    normals: getFlatShadingNormals(positions),
    boneWeights: boneWeights!,
    boneIndexes: new Uint8Array(boneIndexes!),
    boneCount: bindPose.length,
    colorCount: colorCount!,
    colorIndexes: colorIndexes!,
  };

  const animations = [
    animations_[3], // idle
    animations_[9], // run
    animations_[8], // attack
    animations_[0], // death
    animations_[2], // hurt
  ];

  return {
    geometry,
    animations,

    // biome-ignore format: better
    colorPalettes: new Uint8Array([

      //
      ...colorPalette!,

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

    ]),

    bindPose,
  };
};
