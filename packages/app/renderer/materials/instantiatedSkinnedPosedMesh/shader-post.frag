#version 300 es
precision highp float;

uniform sampler2D u_colorTexture;

in vec2 v_texCoord;

out vec4 fragColor;

void main() {
    vec4 color = texture(u_colorTexture, v_texCoord);

    fragColor = vec4(color.b, color.r, color.g, color.a);
    // fragColor.a = 1.0;

    // fragColor = vec4(v_texCoord, 0.0, 1.0);
}
