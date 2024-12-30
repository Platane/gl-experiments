import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import * as THREE from "three";

export const loadGLTF = async (uri: string, name: string) => {
  const loader = new GLTFLoader();
  const res = await loader.loadAsync(uri);

  const mesh = res.scene.getObjectByName(name) as THREE.Mesh;

  const geo = mesh.geometry.toNonIndexed();

  geo.computeBoundingBox();
  console.log(geo.boundingBox);

  const positions = geo.getAttribute("position").array as Float32Array;

  return { positions };
};
