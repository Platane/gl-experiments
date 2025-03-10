import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import * as THREE from "three";
import * as indexedDBCache from "./indexedDB-cache";
import { extractAnimationsPoses } from "./animation";
import { extractVertexColors } from "./color";

export const loadGLTF = async (
  uri: string,
  name: string,
  options: { colorEqualsThreehold?: number } = {},
) => {
  const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath(
    "https://www.gstatic.com/draco/versioned/decoders/1.5.7/",
  );
  loader.setDRACOLoader(dracoLoader);

  const res = await loader.loadAsync(uri);

  const mesh = res.scene.getObjectByName(name) as THREE.SkinnedMesh;

  const geo = mesh.geometry.index
    ? mesh.geometry.toNonIndexed()
    : mesh.geometry;

  geo.applyMatrix4(mesh.matrixWorld);

  const positions = geo.getAttribute("position").array as Float32Array;
  const normals = geo.getAttribute("normal")?.array as Float32Array | undefined;
  const uvs = geo.getAttribute("uv")?.array as Float32Array | undefined;
  const boneIndexes = geo.getAttribute("skinIndex")?.array as
    | Uint16Array
    | undefined;
  const boneWeights = geo.getAttribute("skinWeight")?.array as
    | Float32Array
    | undefined;

  return {
    positions,
    normals,
    boneIndexes,
    boneWeights,
    ...(mesh.skeleton && extractAnimationsPoses(res.animations, mesh.skeleton)),
    ...extractVertexColors(uvs, mesh.material, options),
  };
};

export const loadGLTFwithCache = async (
  uri: string,
  name: string,
  o?: Parameters<typeof loadGLTF>[2],
) => {
  let content = await indexedDBCache.get(uri);

  if (!content) {
    const res = await fetch(uri);
    if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
    content = await res.arrayBuffer();

    await indexedDBCache.put(uri, content);
  }

  const blobUri = URL.createObjectURL(new Blob([content]));

  const res = await loadGLTF(blobUri, name, o);

  URL.revokeObjectURL(blobUri);

  return res;
};
