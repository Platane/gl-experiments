import { mat4, vec3 } from "gl-matrix";
import { invLerp } from "../utils/math";
import { getGeometry as getFoxGeometry } from "../renderer/geometries/fox";
// @ts-ignore
import hash from "hash-int";

export const createState = (
  foxGeometry: Awaited<ReturnType<typeof getFoxGeometry>>,
) => {
  const state = {
    camera: {
      eye: [0, 2, -4] as vec3,
      lookAt: [0, 0, 0] as vec3,
      generation: 1,
    },
    sphere: {
      position: [0, 0, 0] as vec3,
      generation: 1,
    },
    triceratops: {
      positions: new Float32Array([0, 0]),
      directions: new Float32Array([0, 1]),
      poseIndexes: new Uint8Array([0, 1, 0, 0]),
      poseWeights: new Float32Array([0.5, 0.5, 0, 0]),
      paletteIndexes: new Uint8Array([0]),
      n: 1,
      generation: 1,
    },
    fox: {
      positions: new Float32Array([0, 0]),
      directions: new Float32Array([0, 1]),
      poseIndexes: new Uint8Array([0, 1, 0, 0]),
      poseWeights: new Float32Array([1, 0, 0, 0]),
      paletteIndexes: new Uint8Array([1]),
      n: 1,
      generation: 1,
    },
    gizmos: Object.assign([] as mat4[], { generation: 1 }),
  };
  state.gizmos.push(mat4.create());
  state.gizmos.push(mat4.create());
  state.gizmos.push(mat4.create());
  state.gizmos.push(mat4.create());
  mat4.fromTranslation(state.gizmos[0], [0, 0, 0]);
  mat4.fromTranslation(state.gizmos[1], [0.4, 0, 0]);
  mat4.fromTranslation(state.gizmos[2], [-0.4, 0, 0]);
  mat4.fromTranslation(state.gizmos[3], [0, 0, 0.4]);

  {
    const n = 1 << 5;
    const l = Math.floor(Math.sqrt(n));
    state.triceratops.positions = new Float32Array(
      Array.from({ length: n }, (_, i) => [
        (i % l) - l / 2,
        Math.floor(i / l),
      ]).flat(),
    );
    state.triceratops.directions = new Float32Array(
      Array.from({ length: n }, (_, i) => {
        const a = hash(i + 3);
        return [Math.sin(a), Math.cos(a)];
      }).flat(),
    );
    state.triceratops.poseIndexes = new Uint8Array(
      Array.from({ length: n }, (_, i) => [0, hash(i * 2) % 3, 0, 0]).flat(),
    );
    state.triceratops.paletteIndexes = new Uint8Array(
      Array.from({ length: n }, (_, i) => hash(i) % 6),
    );
    state.triceratops.poseWeights = new Float32Array(
      Array.from({ length: n }, (_, i) => [1, 0, 0, 0]).flat(),
    );
    state.triceratops.n = n;
  }

  {
    const n = 1 << 10;
    const l = Math.floor(Math.sqrt(n));

    const shuffleArray = <T>(array: T[]) => {
      for (let i = array.length - 1; i >= 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    };

    state.fox.positions = new Float32Array(
      shuffleArray(
        Array.from({ length: n }, (_, i) => [
          ((i % l) - l / 2) * 120,
          Math.floor(i / l) * 120,
        ]),
      ).flat(),
    );
    state.fox.directions = new Float32Array(
      Array.from({ length: n }, (_, i) => {
        const a = hash(i + 3);
        return [Math.sin(a), Math.cos(a)];
      }).flat(),
    );
    state.fox.poseIndexes = new Uint8Array(
      Array.from({ length: n }, () => [0, 0, 0, 0]).flat(),
    );
    state.fox.paletteIndexes = new Uint8Array(
      Array.from({ length: n }, (_, i) => hash(i + 17) % 6),
    );
    state.fox.poseWeights = new Float32Array(
      Array.from({ length: n }, () => [1, 0, 0, 0]).flat(),
    );
    state.fox.n = n;
  }

  const step = () => {
    const t = Date.now();

    //
    // move gizmo
    //
    {
      state.gizmos[1][12] += 0.001;
      state.gizmos.generation++;
    }

    //
    // animate triceratops
    //
    for (let i = 0; i < state.triceratops.n; i += 1) {
      const k = Math.sin(t * 0.005 + i) * 0.5 + 0.5;
      state.triceratops.poseWeights[i * 4 + 1] = k;
      state.triceratops.poseWeights[i * 4 + 0] = 1 - k;
    }
    state.triceratops.generation++;

    state.sphere.position[0] = Math.sin(t * 0.001) * 200;
    state.sphere.position[2] = 110;
    state.sphere.generation++;

    //
    // animate foxes
    //
    {
      const animations = Object.entries(foxGeometry.animations).map(
        ([name, a], i, arr) => ({
          name,
          ...a,
          poseOffset: arr
            .slice(0, i)
            .reduce((sum, [, { keyFrames }]) => sum + keyFrames.length, 0),
        }),
      );

      for (let j = state.fox.n; j--; ) {
        const { duration, keyFrames, poseOffset } =
          animations[hash(j) % animations.length];

        const time = (Date.now() / 1000 + hash(j + 7) / 10) % duration;

        let i = 0;
        while (keyFrames[i].time <= time) i++;

        const k = invLerp(time, keyFrames[i - 1].time, keyFrames[i].time);

        state.fox.poseIndexes[j * 4 + 0] = poseOffset + i - 1;
        state.fox.poseIndexes[j * 4 + 1] = poseOffset + i;
        state.fox.poseWeights[j * 4 + 0] = 1 - k;
        state.fox.poseWeights[j * 4 + 1] = k;
      }

      state.fox.generation++;
    }
  };

  return { step, state };
};
