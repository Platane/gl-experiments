#version 300 es
precision highp float;

uniform sampler2D u_texture;

out ivec4 fragColor;

void main() {
    ivec2 pixel = ivec2(gl_FragCoord.xy);
    vec4 color = texelFetch(u_texture, pixel, 0);

    if (color.a > 0.0) {
        fragColor = ivec4(gl_FragCoord.xy, 0, 0);
    } else {
        discard;
    }
}
