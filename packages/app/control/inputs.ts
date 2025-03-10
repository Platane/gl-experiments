import { Key, World } from "../world/state";

export const createEventListeners = (
  world: World,
  {
    canvas,
    containerElement = document.body,
  }: { canvas: HTMLCanvasElement; containerElement?: HTMLElement },
) => {
  const cleanupController = new AbortController();
  const o = { signal: cleanupController.signal };

  const keyMap = {
    ArrowUp: "arrow_up",
    ArrowDown: "arrow_down",
    ArrowLeft: "arrow_left",
    ArrowRight: "arrow_right",

    w: "arrow_up",
    s: "arrow_down",
    a: "arrow_left",
    d: "arrow_right",
  } as Record<string, Key>;

  containerElement.addEventListener(
    "keydown",
    (event) => {
      const key = keyMap[event.key];
      if (key) world.inputs.keyDown.add(key);
    },
    o,
  );

  containerElement.addEventListener(
    "keyup",
    (event) => {
      const key = keyMap[event.key];
      world.inputs.keyDown.delete(key);
    },
    o,
  );

  window.addEventListener(
    "blur",
    () => {
      world.inputs.keyDown.clear();
    },
    o,
  );

  const resize = () => {
    const w = canvas.clientWidth * world.camera.devicePixelRatio;
    const h = canvas.clientHeight * world.camera.devicePixelRatio;

    world.camera.aspect = w / h;
    world.camera.viewportSize[0] = w;
    world.camera.viewportSize[1] = h;

    canvas.width = world.camera.viewportSize[0];
    canvas.height = world.camera.viewportSize[1];
  };
  resize();
  window.addEventListener("resize", resize, o);

  const dispose = () => cleanupController.abort();

  return { dispose };
};
