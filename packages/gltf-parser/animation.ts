import * as THREE from "three";
import { invLerp, lerp } from "../app/utils/math";

const pruneRedundantKeyFrames = (
  keyframes: { time: number; pose: THREE.Matrix4Tuple[] }[],
) => {
  const matrixLerp = (
    a1: THREE.Matrix4Tuple,
    a2: THREE.Matrix4Tuple,
    k: number,
  ) => a1.map((_, i) => lerp(k, a1[i], a2[i])) as THREE.Matrix4Tuple;

  const matrixEquals = (a1: THREE.Matrix4Tuple, a2: THREE.Matrix4Tuple) =>
    a1.every((_, i) => Math.abs(a1[i] - a2[i]) < 0.0001);

  for (let i = keyframes.length - 2; i > 0; i--) {
    const k = invLerp(
      keyframes[i].time,
      keyframes[i - 1].time,
      keyframes[i + 1].time,
    );

    const poseRedundant = keyframes[i].pose.every((_, j) => {
      const mk = matrixLerp(
        keyframes[i - 1].pose[j],
        keyframes[i + 1].pose[j],
        k,
      );
      return matrixEquals(mk, keyframes[i].pose[j]);
    });

    if (poseRedundant) keyframes.splice(i, 1);
  }
};

export const extractAnimationsPoses = (
  animationClips: THREE.AnimationClip[],
  skeleton: THREE.Skeleton,
) => {
  skeleton.pose();

  const bones = skeleton.bones;

  bones.forEach((b) => b.updateWorldMatrix(true, false));

  const bindPose = bones.map((b) => b.matrixWorld.toArray());
  const bindPoseInverses = bones.map((b) => b.matrixWorld.clone().invert());

  const mesh = new THREE.SkinnedMesh();
  mesh.bind(skeleton);

  const animations = animationClips.map((animationClip) => {
    animationClip.optimize();

    const keysDate = new Set<number>();
    animationClip.tracks.forEach((track) =>
      track.times.forEach((t) => keysDate.add(t)),
    );

    const mixer = new THREE.AnimationMixer(mesh);
    const action = mixer.clipAction(animationClip);
    action.play();

    const keyFrames = [...keysDate.keys()]
      .sort((a, b) => a - b)
      .map((time) => {
        mixer.setTime(time);

        const pose = bones.map((bone, i) => {
          bone.updateWorldMatrix(true, false);

          const inv = bindPoseInverses[i];

          return new THREE.Matrix4()
            .multiplyMatrices(bone.matrixWorld, inv)
            .toArray();
        });

        return { time, pose };
      });

    pruneRedundantKeyFrames(keyFrames);

    mixer.stopAllAction();
    mixer.uncacheClip(animationClip);
    mixer.uncacheRoot(mesh);

    return {
      keyFrames,
      duration: animationClip.duration,
      name: animationClip.name,
    };
  });

  return { bindPose, animations };
};
