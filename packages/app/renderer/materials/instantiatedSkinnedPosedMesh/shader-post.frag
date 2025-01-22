#version 300 es
precision highp float;

uniform sampler2D u_colorTexture;
uniform sampler2D u_depthTexture;
uniform sampler2D u_normalTexture;
uniform sampler2D u_objectIdTexture;
uniform vec2 u_depthRange;
uniform vec2 u_textelSize;

in vec2 v_texCoord;

out vec4 fragColor;

float readDepth(sampler2D depthTexture, vec2 texCoord, float near, float far) {
    float ndc = 2.0 * texture(depthTexture, texCoord).r - 1.0;
    float depth = -(2.0 * far * near) / (ndc * (far - near) - far - near);

    return depth;
}

void main() {
    float near = u_depthRange.x;
    float far = u_depthRange.y;
    float depth = readDepth(u_depthTexture, v_texCoord, near, far);

    vec4 color = texture(u_colorTexture, v_texCoord);
    vec4 normal = texture(u_normalTexture, v_texCoord);

    vec4 objectId = texture(u_objectIdTexture, v_texCoord);
    int uid = int(objectId.r * 256.0 * 256.0) + int(objectId.g * 256.0);

    fragColor = color;

    for (int i = 0; i < 4; i++) {
        float THRESHOLD = 20.0;

        float u = (floor(float(i) / 2.0));
        float v = mod(float(i), 2.0);

        vec2 offset = (u * 2.0 - 1.0) * vec2(v * u_textelSize.x, (1.0 - v) * u_textelSize.y);

        vec4 adjacentObjectId = texture(u_objectIdTexture, v_texCoord + offset);
        int adjacentUid = int(adjacentObjectId.r * 256.0 * 256.0) + int(adjacentObjectId.g * 256.0);

        float adjacentDepeth = readDepth(u_depthTexture, v_texCoord + offset, near, far);

        if (adjacentUid != uid && depth < adjacentDepeth) {
            fragColor = vec4(0.0, 0.0, 0.0, 1.0);
        }

        // if (depth + THRESHOLD < adjacentDepeth) {
        //     fragColor = vec4(0.0, 0.0, 0.0, 1.0);
        // }
    }

    // float k = (depth - near) / (far - near);
    // fragColor = vec4(k, k, k, 1.0);
}
