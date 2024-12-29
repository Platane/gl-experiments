import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

export const loadGLTF = async (uri: string) => {
  const loader = new GLTFLoader();
  const res = await loader.loadAsync(uri);

  const json = res.parser.json;

  debugger;

  res.scene;
};
