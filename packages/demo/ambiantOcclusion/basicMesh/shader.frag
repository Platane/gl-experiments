#version 300 es
precision highp float;

in vec3 v_normal;

layout(location = 0) out vec4 outColor;
layout(location = 1) out vec4 outNormal;

void main() {
    vec3 color = vec3(0.1, 0.8, 0.3);

    outColor = vec4(color, 1.0);
    outNormal = vec4(v_normal, 1.0);
}
