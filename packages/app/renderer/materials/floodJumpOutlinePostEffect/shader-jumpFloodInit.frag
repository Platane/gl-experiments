#version 300 es
precision highp float;

uniform sampler2D u_objectIdTexture;

in vec2 v_texCoord;
flat in uvec2 v_viewportSize;

out ivec4 fragColor;

void main() {
    vec4 objectId = texture(u_objectIdTexture, v_texCoord);
    int uid = int(objectId.r * 256.0 * 256.0) + int(objectId.g * 256.0);

    fragColor = ivec4(
            int(v_texCoord.r * float(v_viewportSize.x)),
            int(v_texCoord.g * float(v_viewportSize.y)),
            0,
            1
        );
    // if (uid == 13) fragColor = ivec4(int(v_texCoord.r * 256.0), int(v_texCoord.g * 256.0), 0, 1);
    // else discard;
    //

    // fragColor = ivec4(100, 100, 100, 100);
}
