import { mat4 } from "gl-matrix";
import { invLerp } from "../../../utils/math";

export type AnimationMap = {
  duration: number;
  keyFrames: { time: number; pose: mat4[] }[];
}[];

/**
 * return the index i such as
 * steps[i].time < t  &&  t <= steps[i+1].time
 */
const getContainingInterval = (steps: { time: number }[], time: number) => {
  let a = 0;
  let b = steps.length;

  while (b - a > 1) {
    const e = Math.floor((a + b) / 2);
    if (steps[e].time < time) {
      a = e;
    } else {
      b = e;
    }
  }

  return a;
};

export const getPosesData = (
  animationMap: { keyFrames: { pose: mat4[] }[] }[],
) =>
  new Float32Array(
    animationMap.flatMap((a) =>
      a.keyFrames.flatMap((k) => k.pose.flatMap((p) => [...p])),
    ),
  );

export const createAnimationParamsGetter = (animationMap: AnimationMap) => {
  let i = 0;
  const map = animationMap.map((a) => {
    return {
      ...a,
      keyFrames: a.keyFrames.map((k) => ({ ...k, index: i++ })),
    };
  });

  const poses = new Float32Array(
    animationMap.flatMap((a) =>
      a.keyFrames.flatMap((k) => k.pose.flatMap((p) => [...p])),
    ),
  );

  const applyAnimationParams = (
    {
      poseIndexes,
      poseWeights,
    }: {
      poseIndexes: Uint8Array;
      poseWeights: Float32Array;
    },

    {
      animationIndexes,
      animationTimes,
    }: {
      animationIndexes: Uint8Array;
      animationTimes: Float32Array;
    },

    n: number = animationIndexes.length,
    offset = 0,
  ) => {
    for (let i = offset; i < offset + n; i++) {
      const index = animationIndexes[i];
      const time = animationTimes[i];

      const { duration, keyFrames } = map[index];

      const t = time % duration;

      const a = getContainingInterval(keyFrames, t);
      const b = a + 1;

      const k = invLerp(t, keyFrames[a].time, keyFrames[b].time);

      poseIndexes[i * 2 + 0] = keyFrames[a].index;
      poseIndexes[i * 2 + 1] = keyFrames[b].index;

      poseWeights[i * 2 + 0] = 1 - k;
      poseWeights[i * 2 + 1] = k;
    }
  };

  return { applyAnimationParams, poses };
};
