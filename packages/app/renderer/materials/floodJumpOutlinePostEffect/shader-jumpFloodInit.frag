#version 300 es
precision highp float;

uniform sampler2D u_objectIdTexture;

in vec2 v_texCoord;

out vec4 fragColor;

void main() {
    vec4 objectId = texture(u_objectIdTexture, v_texCoord);
    int uid = int(objectId.r * 256.0 * 256.0) + int(objectId.g * 256.0);

    if (uid == 13) fragColor = vec4(v_texCoord, 0.0, 1.0);
    else discard;
}
