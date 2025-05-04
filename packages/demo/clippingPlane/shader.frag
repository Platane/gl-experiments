#version 300 es
precision highp float;

in vec3 v_normal;
in vec3 v_color;
in float v_clippingDistance;

out vec4 outColor;

void main() {
    vec3 l = vec3(0.615457, 0.492365, 0.615457);

    float p = dot(v_normal, l);

    outColor.rgba = vec4(v_color, 1.0);

    outColor.rgb *= 0.6 + clamp(p, -0.47, 10.0) * 0.45;

    if ( v_clippingDistance <= 0.0 ) {
        discard;
    }
}
