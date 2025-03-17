import { createWorld, stepWorld, World } from "./stepWorld";

let world: World;
self.addEventListener("message", (event) => {
  const data = event.data;
  if (data && data.step && world) {
    navigator.locks.request("world-lock", (lock) => stepWorld(world));
  } else if (
    data &&
    data.create &&
    data.buffer instanceof SharedArrayBuffer &&
    data.animationParamsMap &&
    typeof data.N === "number"
  ) {
    console.log("received shared buffer array");

    world = createWorld(data.N, data.buffer, data.animationParamsMap);
  }
});
