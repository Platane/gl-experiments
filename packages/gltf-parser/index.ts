import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import * as THREE from "three";
import * as indexedDBCache from "./indexedDB-cache";

export const loadGLTF = async (uri: string, name: string) => {
  const loader = new GLTFLoader();
  const res = await loader.loadAsync(uri);

  const mesh = res.scene.getObjectByName(name) as THREE.SkinnedMesh;

  const geo = mesh.geometry.index
    ? mesh.geometry.toNonIndexed()
    : mesh.geometry;
  geo.computeBoundingBox();

  const bones = mesh.skeleton?.bones ?? [];
  const bindPose = bones.map((b) => b.matrixWorld.toArray());
  const bindPoseInverses = bones.map((b) => b.matrixWorld.clone().invert());

  const positions = geo.getAttribute("position").array as Float32Array;
  const normals = geo.getAttribute("normal")?.array as Float32Array | undefined;

  const animations = Object.fromEntries(
    res.animations.map((animationClip) => {
      animationClip.optimize();

      const mixer = new THREE.AnimationMixer(mesh);

      const keysDate = new Set<number>();
      animationClip.tracks.forEach((track) =>
        track.times.forEach((t) => keysDate.add(t)),
      );

      const action = mixer.clipAction(animationClip);
      action.play();

      const keyFrames = [...keysDate.keys()]
        .sort((a, b) => a - b)
        .map((time) => {
          mixer.setTime(time);

          const pose = mesh.skeleton.bones.map((bone, i) => {
            bone.updateWorldMatrix(true, false);

            const inv = bindPoseInverses[i];

            return new THREE.Matrix4()
              .multiplyMatrices(bone.matrixWorld, inv)
              .toArray();
          });

          return { time, pose };
        });

      return [
        animationClip.name,
        { keyFrames, duration: animationClip.duration },
      ];
    }),
  );

  return { positions, normals, bindPose, animations };
};

export const loadGLTFwithCache = async (uri: string, name: string) => {
  let content = await indexedDBCache.get(uri);

  if (!content) {
    const res = await fetch(uri);
    if (!res.ok)
      throw new Error(await res.text().catch((err) => res.statusText));
    content = await res.arrayBuffer();

    await indexedDBCache.put(uri, content);
  }

  const blobUri = URL.createObjectURL(new Blob([content]));

  const res = await loadGLTF(blobUri, name);

  URL.revokeObjectURL(blobUri);

  return res;
};
