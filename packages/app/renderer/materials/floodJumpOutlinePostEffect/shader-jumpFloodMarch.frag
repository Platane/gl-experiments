#version 300 es
precision highp float;

uniform sampler2D u_texture;
// uniform vec2 u_textelSize;
uniform vec2 u_offsetSize;

in vec2 v_texCoord;

out vec4 fragColor;

void main() {
    float minDistance = 999.0;
    vec2 closestSeed = vec2(0.0, 0.0);
    for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
            vec4 c = texture(u_texture, v_texCoord + u_offsetSize * vec2(float(x), float(y)));

            float distance = length(c.xy - v_texCoord.xy);

            if (distance < minDistance && (c.x != 0.0 || c.y != 0.0)) {
                minDistance = distance;
                closestSeed = c.xy;
            }
        }
    }

    // discard;

    fragColor = vec4(closestSeed.xy, 0.0, 1.0);
}
