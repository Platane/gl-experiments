import { loadGLTFwithCache } from "../../../gltf-parser/loadGLTF";
import { computeWeights } from "../../utils/bones";

// import model_glb from "../../assets/models/T-Rex.glb?url";
const model_glb =
  "https://raw.githubusercontent.com/platane/gl-experiments/assets/Apatosaurus.glb";

export const getParaModel = async () => {
  const parts = [await loadGLTFwithCache(model_glb, "Parasaurolophus_1")];
  for (const name of [
    "Parasaurolophus_2",
    "Parasaurolophus_3",
    "Parasaurolophus_4",
  ]) {
    parts.push(await loadGLTFwithCache(model_glb, name));
  }
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

      129, 130, 111,
      85, 92, 79,
      118, 130, 119,
      231, 231, 231,

      132, 130, 111,
      95, 97, 79,
      118, 130, 119,
      231, 221, 211,



    ]),

    bindPose: parts[0].bindPose,
  };
};
