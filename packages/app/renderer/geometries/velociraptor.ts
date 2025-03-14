import { loadGLTFwithCache } from "../../../gltf-parser/loadGLTF";

// import model_glb from "../../assets/models/Velociraptor.glb?url";
const model_glb =
  "https://raw.githubusercontent.com/platane/gl-experiments/assets/Raptor.glb";

export const getVelociraptorModel = async () => {
  const parts = await loadGLTFwithCache(model_glb, [
    "Velociraptor_1",
    "Velociraptor_2",
    "Velociraptor_3",
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
      98, 81, 73,
      75, 58, 50,
      14,  14,  14,

      155, 155, 173,
      75, 58, 50,
      14,  14,  14,
    ]),

    bindPose: parts[0].bindPose,
  };
};
