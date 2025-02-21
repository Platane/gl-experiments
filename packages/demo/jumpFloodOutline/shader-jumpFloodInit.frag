#version 300 es
precision highp float;
precision highp int;

uniform sampler2D u_texture;

out ivec2 fragColor;

void main() {
    ivec2 pixel = ivec2(gl_FragCoord.xy);
    vec4 color = texelFetch(u_texture, pixel, 0);

    if (color.a > 0.0) {
        fragColor = ivec2(gl_FragCoord.xy);
    } else {
        fragColor = ivec2(-999, -999);
    }
}
