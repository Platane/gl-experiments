#version 300 es
precision highp float;
precision highp isampler2D;

uniform isampler2D u_texture;
// uniform sampler2D u_texture;

out vec4 fragColor;

void main() {
    ivec2 pixel = ivec2(gl_FragCoord.xy);
    ivec4 color = texelFetch(u_texture, pixel, 0);

    ivec2 size = textureSize(u_texture, 0);

    fragColor = vec4(float(color.r) / 300.0, float(color.g) / 300.0, 0.0, 1.0);
}
