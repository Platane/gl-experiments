#version 300 es
precision highp float;

uniform sampler2D u_colorTexture;
uniform sampler2D u_depthTexture;
uniform sampler2D u_normalTexture;
uniform vec2 u_depthRange;

in vec2 v_texCoord;

out vec4 fragColor;

float readDepth(sampler2D depthTexture, vec2 texCoord, float near, float far) {
    float ndc = 2.0 * texture(depthTexture, v_texCoord).r - 1.0;
    float depth = -(2.0 * far * near) / (ndc * (far - near) - far - near);

    return depth;
}

void main() {
    float near = u_depthRange.x;
    float far = u_depthRange.y;
    float depth = readDepth(u_depthTexture, v_texCoord, near, far);

    fragColor = vec4(depth / far, depth / far, depth / far, 1.0);

    float k = (depth - near) / (far - near);

    vec4 color = texture(u_colorTexture, v_texCoord);
    vec4 normal = texture(u_normalTexture, v_texCoord);

    fragColor = vec4((color * (1.0 - k)).rgb, color.a);
}
