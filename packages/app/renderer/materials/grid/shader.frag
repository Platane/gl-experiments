#version 300 es
precision highp float;

uniform float u_lineWidth;
uniform vec3 u_lineColor;

in vec2 v_texCoord;
in float v_depth;
in vec3 v_normal;

out vec4 outColor;

float invLerp(float from, float to, float value) {
    return (value - from) / (to - from);
}

void main() {
    float x = mod(v_texCoord.x, 1.0);
    float y = mod(v_texCoord.y, 1.0);

    float minDistance = min(1.0 - y, min(1.0 - x, min(x, y)));

    float d = clamp(invLerp(2.0, 30.0, v_depth), 0.0, 1.0);
    float n = v_normal.y * v_normal.y;

    float spread = mix(0.006, 0.02, d * d);

    if (minDistance > u_lineWidth + spread) {
        discard;
    } else {
        float coverage = 1.0 - (minDistance - u_lineWidth) / spread;

        outColor = vec4(u_lineColor, coverage);
    }
}
