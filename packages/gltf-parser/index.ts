import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import * as THREE from "three";

export const loadGLTF = async (uri: string, name: string) => {
  const loader = new GLTFLoader();
  const res = await loader.loadAsync(uri);

  const mesh = res.scene.getObjectByName(name) as THREE.SkinnedMesh;

  const geo = mesh.geometry.index
    ? mesh.geometry.toNonIndexed()
    : mesh.geometry;
  geo.computeBoundingBox();

  const bindPose = mesh.skeleton.bones.map((b) => b.matrixWorld.toArray());
  const bindPoseInverses = mesh.skeleton.bones.map((b) =>
    b.matrixWorld.clone().invert(),
  );

  const positions = geo.getAttribute("position").array as Float32Array;

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

  return { positions, bindPose, animations };
};
