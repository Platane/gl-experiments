#version 300 es
precision highp float;

uniform highp isampler2D u_texture;

in vec2 v_texCoord;
out vec4 fragColor;

void main() {
    ivec2 pixel = ivec2(
            int(v_texCoord.x * float(v_viewportSize.x)),
            int(v_texCoord.y * float(v_viewportSize.y))
        );
    ivec4 color = texelFetch(u_texture, pixel, 0);

    fragColor = vec4(float(pixel.x) / 200.0, float(pixel.y) / 200.0, 0.3, 1.0);

    // ivec4 color = texture(u_texture, v_texCoord);
    fragColor = vec4(float(color.r), float(color.g), 0.17, 1.0);

    // fragColor = vec4(float(gl_FragCoord.x) / 200.0, float(gl_FragCoord.y) / 200.0, 0.0, 1.0);

    // if (fragColor.a < 0.1) discard;
}
