#version 300 es
precision highp float;

uniform sampler2D u_texture;

in vec2 v_texCoord;

out vec4 fragColor;

void main() {
    vec2 closest = texture(u_texture, v_texCoord).xy;

    float distance = length(closest - v_texCoord);

    if (distance < 0.02) {
        fragColor = vec4(0.0, 0.0, 0.8, 1.0);
        if (distance < 0.01) {
            fragColor = vec4(0.0, 0.0, 0.5, 1.0);
        }
        if (distance < 0.002) {
            fragColor = vec4(0.0, 0.0, 0.3, 1.0);
        }
    } else discard;
}
