# GL

demo
- [basic mesh](http://platane.github.io/gl-experiments/demo/basicMesh)
- [depth texture](http://platane.github.io/gl-experiments/demo/depthTexture)
- [int sampler](http://platane.github.io/gl-experiments/demo/intSampler)
- [jump flood outline](http://platane.github.io/gl-experiments/demo/jumpFloodOutline)
- [ambient occlusion](http://platane.github.io/gl-experiments/demo/ambientOcclusion)
- [reconstruct fragment position](http://platane.github.io/gl-experiments/demo/reconstructFragmentPosition)

# Usage

```sh

# dev server for demos
bun vite packages/demo/basicMesh

```

# TODO

- [ ] use bun build eventually
      `bun build ./packages/demo/basicMesh/index.html --outdir=dist --loader=.vert:text --loader=.frag:text`
      so far the bundler does not dead code eliminate gl-matrix
- [ ] test animation pose VS uploading a texture with all instances skeleton (likely pretty cheap?) = less texture read in vertex shader

# References

- [The Quest for Very Wide Outlines - Ben Golus](https://bgolus.medium.com/the-quest-for-very-wide-outlines-ba82ed442cd9)
- [webgl 2 examples](https://github.com/tsherif/webgl2examples)
- [framebuffer object technique](https://www.youtube.com/@osakaandrew/videos)
- [isampler2d usage](https://github.com/aadebdeb/Sample_WebGL2_IntegerTexture)
- [poly.pizza model store](https://poly.pizza/)
