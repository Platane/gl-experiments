# GL

demo
- [basic mesh](https://platane.github.io/gl-experiments/demo/basicMesh)
- [depth texture](https://platane.github.io/gl-experiments/demo/depthTexture)
- [int sampler](https://platane.github.io/gl-experiments/demo/intSampler)
- [clipping plane](https://platane.github.io/gl-experiments/demo/clippingPlane)
- [jump flood outline](https://platane.github.io/gl-experiments/demo/jumpFloodOutline)
- [ambient occlusion](https://platane.github.io/gl-experiments/demo/ambientOcclusion)
- [reconstruct fragment position](https://platane.github.io/gl-experiments/demo/reconstructFragmentPosition)
- [instantiated animated](https://platane.github.io/gl-experiments/demo/instantiatedAnimated)
- [parallel logic](https://platane.github.io/gl-experiments/demo/parallelLogic)

# Usage

```sh

# dev server for demos
bun vite packages/demo/basicMesh

```

# TODO

- [ ] use bun build eventually
      `bun build ./packages/demo/basicMesh/index.html --outdir=dist --loader=.vert:text --loader=.frag:text`
      so far the bundler does not dead code eliminate gl-matrix
- [ ] learn multisampling buffers

# References

- [The Quest for Very Wide Outlines - Ben Golus](https://bgolus.medium.com/the-quest-for-very-wide-outlines-ba82ed442cd9)
- [webgl 2 examples](https://github.com/tsherif/webgl2examples)
- [framebuffer object technique](https://www.youtube.com/@osakaandrew/videos)
- [isampler2d usage](https://github.com/aadebdeb/Sample_WebGL2_IntegerTexture)
- [poly.pizza model store](https://poly.pizza/)
