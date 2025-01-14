import { vec3 } from "gl-matrix";
import { clamp } from "../utils/math";

export type Handler = (
  touches: { pageX: number; pageY: number; button?: number }[],
) => void;

export const createOrbitControl = (
  { canvas }: { canvas: HTMLCanvasElement },
  state: {
    eye: vec3;
    lookAt: vec3;
    generation: number;
  },
) => {
  let phi = Math.PI / 8;
  let theta = Math.PI;
  let radius = 500;

  const ROTATION_SPEED = 3.5;
  const MIN_RADIUS = 2;
  const MAX_RADIUS = 1400;

  const update = () => {
    state.eye[0] = state.lookAt[0] + radius * Math.sin(theta) * Math.cos(phi);
    state.eye[1] = state.lookAt[1] + radius * Math.sin(phi);
    state.eye[2] = state.lookAt[2] + radius * Math.cos(theta) * Math.cos(phi);

    state.generation++;
  };
  update();

  let rotate_px: number | null = null;
  let rotate_py: number | null = null;

  const rotateStart: Handler = ([{ pageX: x, pageY: y }]) => {
    rotate_px = x;
    rotate_py = y;
  };
  const rotateMove: Handler = ([{ pageX: x, pageY: y }]) => {
    if (rotate_px !== null) {
      const dx = x - rotate_px!;
      const dy = y - rotate_py!;

      theta -= (dx / window.innerHeight) * ROTATION_SPEED;
      phi += (dy / window.innerHeight) * ROTATION_SPEED;

      phi = clamp(phi, Math.PI * 0.0002, Math.PI * 0.42);

      rotate_px = x;
      rotate_py = y;

      update();
    }
  };
  const rotateEnd: Handler = () => {
    rotate_px = null;
  };

  const touchStart: Handler = (touches) => {
    if (touches.length === 1) rotateStart(touches);
  };
  const touchMove: Handler = (touches) => {
    rotateMove(touches);
  };
  const touchEnd: Handler = (touches) => {
    rotateEnd(touches);
  };

  canvas.ontouchstart = (event) => touchStart(Array.from(event.touches));
  canvas.ontouchmove = (event) => touchMove(Array.from(event.touches));
  canvas.ontouchend = (event) => touchEnd(Array.from(event.touches));

  canvas.onmousedown = (event) => touchStart([event]);
  canvas.onmousemove = (event) => touchMove([event]);
  canvas.onmouseup = (event) => touchEnd([]);

  window.onblur = canvas.onmouseleave = () => {
    touchEnd([]);
  };

  canvas.oncontextmenu = (e) => e.preventDefault();

  canvas.onwheel = (event) => {
    const zoom = Math.sqrt(radius);

    const newZoom = zoom + event.deltaY * 0.02;

    radius = clamp(newZoom ** 2, MIN_RADIUS, MAX_RADIUS);

    update();
  };
};
