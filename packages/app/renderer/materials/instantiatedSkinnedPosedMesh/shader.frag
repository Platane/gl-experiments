#version 300 es
precision highp float;

in vec3 v_normal;
in vec3 v_color;
flat in int v_instanceIndex;

layout(location = 0) out vec4 outColor;
layout(location = 1) out vec4 outNormal;

void main() {
    vec3 lightDirection = vec3(0.615457, 0.492365, 0.615457);

    float p = dot(v_normal, lightDirection);

    outColor.rgba = vec4(v_color, 1.0);

    outColor.rgb *= 0.6 + clamp(p, -0.47, 10.0) * 0.45;

    outNormal = vec4(v_normal, 1.0);
}
