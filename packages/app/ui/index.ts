import { World } from "../world/state";

export const createUI = () => {
  const containerDom = document.createElement("div");
  (containerDom as any).style = `
     position:absolute;
     top:0;
     left:0;
     right:0;
     bottom:0;
     width:100%;
     height:100%;
     pointer-events:none;
  `;

  const headerDom = document.createElement("header");
  (headerDom as any).style = `
     position:absolute;
     top:0;
     left:0;
     padding:4px;
  `;

  containerDom.appendChild(headerDom);

  const update = (world: World) => {
    headerDom.innerText = `time: ${world.time.toFixed(1)}s`;
  };

  return { update, containerDom };
};
