#version 300 es

precision highp float;

uniform mat4 u_viewMatrix;
uniform mat4 u_viewMatrixInv;

uniform float u_viewportSize;

uniform sampler2D u_depthTexture;
uniform sampler2D u_colorTexture;

in vec2 v_texCoord;

out vec4 fragColor;

void main() {

    // get the point in screen space, then project in world space
    vec4 originScreenSpace = vec4((v_texCoord.xy * 2.0 - 1.0), (2.0 * texture(u_depthTexture, v_texCoord).r) - 1.0, 1.0);

    vec4 originWorldSpace = u_viewMatrixInv * originScreenSpace;
    originWorldSpace.xyz /= originWorldSpace.w;

    // project into a box of u_viewportSize, to fit the [0,1]x[0,1]x[0,1] space
    fragColor = vec4((originWorldSpace.xyz + u_viewportSize) / (u_viewportSize * 2.0), 1.0);
}
