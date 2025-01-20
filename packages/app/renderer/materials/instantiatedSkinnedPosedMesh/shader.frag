#version 300 es
precision highp float;

in vec3 v_normal;
in vec3 v_color;
flat in int v_instanceIndex;
flat in int v_colorIndex;

layout(location = 0) out vec4 outColor;
layout(location = 1) out vec4 outNormal;
layout(location = 2) out vec4 outObjectId;

void main() {
    vec3 l = vec3(0.615457, 0.492365, 0.615457);

    vec3 normal = normalize(v_normal);

    float p = dot(normal, l);

    outColor.rgba = vec4(v_color, 1.0);

    outColor.rgb *= 0.6 + clamp(p, -0.47, 10.0) * 0.45;

    outNormal = vec4(v_normal, 1.0);

    outObjectId = vec4(
            float(v_instanceIndex) / (256.0 * 256.0),
            float(v_instanceIndex) / (256.0),
            float(v_colorIndex) / (256.0),
            0.0
        );
}
