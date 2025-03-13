import { mat4 } from "gl-matrix";
import { invLerp } from "../../../utils/math";

export type AnimationMap = {
  duration: number;
  keyFrames: { time: number; pose: mat4[] }[];
}[];

export type AnimationParamsMap = {
  duration: number;
  keyFrames: { index: number; time: number }[];
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

export const getAnimationParamsMap = (animationMap: AnimationMap) => {
  let i = 0;
  return animationMap.map((a) => {
    return {
      ...a,
      keyFrames: a.keyFrames.map((k) => ({ ...k, index: i++ })),
    };
  });
};

export const fillAnimationParams = (
  map: AnimationParamsMap,

  poseIndexes: Uint8Array,
  poseWeights: Float32Array,
  index: number,

  animationIndex: number,
  animationTime: number,
) => {
  const { duration, keyFrames } = map[animationIndex];

  const t = animationTime % duration;

  const a = getContainingInterval(keyFrames, t);
  const b = a + 1;

  const k = invLerp(t, keyFrames[a].time, keyFrames[b].time);

  poseIndexes[index + 0] = keyFrames[a].index;
  poseIndexes[index + 1] = keyFrames[b].index;

  poseWeights[index + 0] = 1 - k;
  poseWeights[index + 1] = k;
};

export const fillBlendedAnimationParams = (
  map: AnimationParamsMap,

  poseIndexes: Uint8Array,
  poseWeights: Float32Array,
  index: number,

  animation1Index: number,
  animation1Time: number,
  animation1Weight: number,

  animation2Index: number,
  animation2Time: number,
  animation2Weight: number,
) => {
  fillAnimationParams(
    map,
    poseIndexes,
    poseWeights,
    index,
    animation1Index,
    animation1Time,
  );
  fillAnimationParams(
    map,
    poseIndexes,
    poseWeights,
    index + 2,
    animation2Index,
    animation2Time,
  );

  poseWeights[index + 0] *= animation1Weight;
  poseWeights[index + 1] *= animation1Weight;
  poseWeights[index + 2] *= animation2Weight;
  poseWeights[index + 3] *= animation2Weight;
};
