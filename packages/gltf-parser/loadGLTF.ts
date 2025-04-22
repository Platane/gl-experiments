import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import * as THREE from "three";
import * as indexedDBCache from "./indexedDB-cache";
import { extractAnimationsPoses } from "./animation";
import { extractVertexColors } from "./color";

const extractOneMesh = (
  res: GLTF,
  name: string,
  options?: { colorEqualsThreehold?: number },
) => {
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
    ...extractVertexColors(uvs, mesh.material, positions.length / 3, options),
  };
};

export const loadGLTF = async (
  uri: string,
  names: string[] | "all",
  options?: { colorEqualsThreehold?: number },
) => {
  const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath(
    "https://www.gstatic.com/draco/versioned/decoders/1.5.7/",
  );
  loader.setDRACOLoader(dracoLoader);

  const res = await loader.loadAsync(uri);

  if (names === "all") {
    const n = new Set<string>();
    res.scene.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) n.add(o.name);
    });
    names = [...n.keys()];
  }

  return names.map((name) => extractOneMesh(res, name, options));
};

export const loadGLTFwithCache = async (
  ...params: Parameters<typeof loadGLTF>
) => {
  const [uri, ...rest] = params;
  let content = await indexedDBCache.get(uri);

  if (!content) {
    const res = await fetch(uri);
    if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
    content = await res.arrayBuffer();

    await indexedDBCache.put(uri, content);
  }

  const blobUri = URL.createObjectURL(new Blob([content]));

  const res = await loadGLTF(blobUri, ...rest);

  URL.revokeObjectURL(blobUri);

  return res;
};

export const mergeModels = (parts: ReturnType<typeof extractOneMesh>[]) => {
  let colorIndexOffset = 0;
  return {
    positions: Float32Array.from(parts.flatMap((a) => [...a.positions])),
    normals:
      parts[0].normals &&
      Float32Array.from(parts.flatMap((a) => [...a.normals!])),
    colorIndexes:
      parts[0].colorIndexes &&
      Uint8Array.from(
        parts.flatMap((a) => {
          const colorIndexes = a.colorIndexes!.map((i) => i + colorIndexOffset);

          colorIndexOffset += a.colorCount ?? 0;

          return [...colorIndexes];
        }),
      ),
    boneIndexes:
      parts[0].normals &&
      Uint8Array.from(parts.flatMap((a) => [...a.boneIndexes!])),
    boneWeights:
      parts[0].normals &&
      Float32Array.from(parts.flatMap((a) => [...a.boneWeights!])),
    colorCount: colorIndexOffset,
    colorPalette:
      parts[0].colorPalette &&
      Float32Array.from(parts.flatMap((a) => [...a.colorPalette!])),
  };
};
