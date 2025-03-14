import { loadGLTFwithCache } from "../../../gltf-parser/loadGLTF";
import { computeWeights } from "../../utils/bones";

// import model_glb from "../../assets/models/T-Rex.glb?url";
const model_glb =
  "https://raw.githubusercontent.com/platane/gl-experiments/assets/T-Rex.glb";

export const getTrexModel = async () => {
  const parts = await loadGLTFwithCache(model_glb, [
    "Trex_1",
    "Trex_2",
    "Trex_3",
    "Trex_4",
    "Trex_5",
  ]);
  parts.forEach((p, i) => {
    p.colorIndexes = new Uint8Array(
      Array.from({ length: p.positions.length / 3 }, () => i),
    );
  });

  const geometry = {
    positions: Float32Array.from(parts.flatMap((a) => [...a.positions])),
    normals: Float32Array.from(parts.flatMap((a) => [...a.normals!])),
    colorIndexes: Uint8Array.from(parts.flatMap((a) => [...a.colorIndexes!])),
    boneIndexes: Uint8Array.from(parts.flatMap((a) => [...a.boneIndexes!])),
    boneWeights: Float32Array.from(parts.flatMap((a) => [...a.boneWeights!])),
    colorCount: parts.length,
    boneCount: parts[0].bindPose.length,
  };

  const animations = [
    parts[0].animations[2], // idle
    parts[0].animations[4], // run
    parts[0].animations[0], // attack
    parts[0].animations[1], // death
  ];

  return {
    geometry,
    animations,

    // biome-ignore format: better
    colorPalettes: new Uint8Array([
      186, 148, 95,
      144, 160, 100,
      74,  85,  66,
      14,  14,  14,
      135, 60,  67,

      186, 148, 95,
      134, 130, 100,
      69,  75,  66,
      14,  14,  14,
      135, 60,  67,


    ]),

    bindPose: parts[0].bindPose,
  };
};
