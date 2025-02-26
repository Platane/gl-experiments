#version 300 es

precision highp float;

uniform sampler2D u_ambientOcclusionTexture;
uniform sampler2D u_colorTexture;
uniform sampler2D u_depthTexture;
uniform sampler2D u_normalTexture;

in vec2 v_texCoord;

out vec4 fragColor;

void main() {
    float ao = texture(u_ambientOcclusionTexture, v_texCoord).r;
    vec4 color = texture(u_colorTexture, v_texCoord);
    vec3 normal = texture(u_normalTexture, v_texCoord).xyz;

    fragColor = vec4(color.xyz * ao, color.a);
    fragColor = vec4((normal * 2.0 - 1.0), color.a);
    fragColor = vec4(ao, ao, ao, 1.0);
}
