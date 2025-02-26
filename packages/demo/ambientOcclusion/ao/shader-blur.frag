#version 300 es

precision highp float;

uniform sampler2D u_texture;

uniform int u_blurRadius;

in vec2 v_texCoord;
flat in uvec2 v_viewportSize;

out float out_value;

void main() {
    float value = 0.0;
    float count = 0.0;

    float l = float(u_blurRadius);

    for (float y = -l; y <= l; y++) {
        for (float x = -l; x <= l; x++) {
            vec2 offset = vec2(x / float(v_viewportSize.x), y / float(v_viewportSize.y));

            float v = texture(u_texture, v_texCoord + offset).r;

            value += v;
            count++;
        }
    }

    out_value = value / count;
}
