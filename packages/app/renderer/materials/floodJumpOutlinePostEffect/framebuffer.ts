export const createFramebuffer = (gl: WebGL2RenderingContext) => {
  const colorTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, colorTexture);
  gl.texStorage2D(
    gl.TEXTURE_2D,
    1,
    gl.RGBA8,
    gl.drawingBufferWidth,
    gl.drawingBufferHeight,
  );

  const normalTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, normalTexture);
  gl.texStorage2D(
    gl.TEXTURE_2D,
    1,
    gl.RGBA8,
    gl.drawingBufferWidth,
    gl.drawingBufferHeight,
  );

  const depthTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, depthTexture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texStorage2D(
    gl.TEXTURE_2D,
    1,
    gl.DEPTH24_STENCIL8,
    gl.drawingBufferWidth,
    gl.drawingBufferHeight,
  );

  const objectIdTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, objectIdTexture);
  gl.texStorage2D(
    gl.TEXTURE_2D,
    1,
    gl.RGBA8,
    gl.drawingBufferWidth,
    gl.drawingBufferHeight,
  );

  gl.bindTexture(gl.TEXTURE_2D, null);

  const framebuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    colorTexture,
    0,
  );
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT1,
    gl.TEXTURE_2D,
    normalTexture,
    0,
  );
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT2,
    gl.TEXTURE_2D,
    objectIdTexture,
    0,
  );
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.DEPTH_ATTACHMENT,
    gl.TEXTURE_2D,
    depthTexture,
    0,
  );

  gl.drawBuffers([
    gl.COLOR_ATTACHMENT0,
    gl.COLOR_ATTACHMENT1,
    gl.COLOR_ATTACHMENT2,
  ]);

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  const dispose = () => {
    gl.deleteTexture(normalTexture);
    gl.deleteTexture(colorTexture);
    gl.deleteTexture(depthTexture);
    gl.deleteTexture(objectIdTexture);

    gl.deleteFramebuffer(framebuffer);
  };

  const clear = () => {
    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.clearBufferfv(gl.COLOR, 0, new Float32Array([0, 0, 0, 0]));
    gl.clearBufferfv(gl.COLOR, 1, new Float32Array([0, 0, 0, 0]));
    gl.clearBufferfv(gl.COLOR, 2, new Float32Array([0, 0, 0, 0]));
  };

  /**
   * copy from the default depth buffer to the frame buffer depth buffer
   */
  const copyFromDefaultDepth = () => {
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, framebuffer);
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
    gl.blitFramebuffer(
      0,
      0,
      gl.drawingBufferWidth,
      gl.drawingBufferHeight,
      0,
      0,
      gl.drawingBufferWidth,
      gl.drawingBufferHeight,
      gl.DEPTH_BUFFER_BIT,
      gl.NEAREST,
    );

    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
  };

  /**
   * copy the framebuffer depth buffer to the default framebuffer depth buffer
   */
  const copyToDefaultDepth = () => {
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, framebuffer);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
    gl.blitFramebuffer(
      0,
      0,
      gl.drawingBufferWidth,
      gl.drawingBufferHeight,
      0,
      0,
      gl.drawingBufferWidth,
      gl.drawingBufferHeight,
      gl.DEPTH_BUFFER_BIT,
      gl.NEAREST,
    );

    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
  };

  return {
    dispose,

    colorTexture,
    normalTexture,
    objectIdTexture,
    depthTexture,

    framebuffer,
  };
};
