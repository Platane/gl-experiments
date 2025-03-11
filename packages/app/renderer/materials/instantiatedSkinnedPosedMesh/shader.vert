#version 300 es
precision highp float;

// attributes
in vec4 a_position;
in vec4 a_normal;
in uint a_colorIndex;

in vec4 a_boneWeights;
in uvec4 a_boneIndexes;

in vec2 a_instancePosition;
in uint a_instanceColorPaletteIndex;
in vec2 a_instanceDirection;
in vec2 a_instancePoseWeights;
in uvec2 a_instancePoseIndexes;

// uniforms
uniform mat4 u_viewMatrix;
uniform sampler2D u_posesTexture;
uniform sampler2D u_colorPalettesTexture;

out vec3 v_normal;
out vec3 v_color;
flat out int v_instanceIndex;

mat4 getBoneMatrix(sampler2D posesTexture, uint poseIndex, uint boneIndex) {
    return mat4(
        texelFetch(posesTexture, ivec2(4 * int(boneIndex) + 0, int(poseIndex)), 0),
        texelFetch(posesTexture, ivec2(4 * int(boneIndex) + 1, int(poseIndex)), 0),
        texelFetch(posesTexture, ivec2(4 * int(boneIndex) + 2, int(poseIndex)), 0),
        texelFetch(posesTexture, ivec2(4 * int(boneIndex) + 3, int(poseIndex)), 0)
    );
}

mat4 getWeightedBoneMatrix(sampler2D posesTexture, uvec2 instancePoseIndexes, vec2 instancePoseWeights, uvec4 boneIndexes, vec4 poseWeights) {
    mat4 bm0 =
        getBoneMatrix(posesTexture, a_instancePoseIndexes[0], boneIndexes[0]) * poseWeights[0] +
            getBoneMatrix(posesTexture, a_instancePoseIndexes[0], boneIndexes[1]) * poseWeights[1] +
            getBoneMatrix(posesTexture, a_instancePoseIndexes[0], boneIndexes[2]) * poseWeights[2] +
            getBoneMatrix(posesTexture, a_instancePoseIndexes[0], boneIndexes[3]) * poseWeights[3];

    mat4 bm1 =
        getBoneMatrix(posesTexture, a_instancePoseIndexes[1], boneIndexes[0]) * poseWeights[0] +
            getBoneMatrix(posesTexture, a_instancePoseIndexes[1], boneIndexes[1]) * poseWeights[1] +
            getBoneMatrix(posesTexture, a_instancePoseIndexes[1], boneIndexes[2]) * poseWeights[2] +
            getBoneMatrix(posesTexture, a_instancePoseIndexes[1], boneIndexes[3]) * poseWeights[3];

    return bm0 * instancePoseWeights[0] + bm1 * instancePoseWeights[1];
}

void main() {
    mat4 bm = getWeightedBoneMatrix(
            u_posesTexture,
            uvec2(a_instancePoseIndexes),
            vec2(a_instancePoseWeights),
            a_boneIndexes,
            a_boneWeights
        );

    mat3 rot = mat3(
            a_instanceDirection.y, 0, -a_instanceDirection.x,
            0, 1, 0,
            a_instanceDirection.x, 0, a_instanceDirection.y
        );

    vec4 p = vec4((rot * (bm * a_position).xyz), 1.0);

    p.x += a_instancePosition.x;
    p.z += a_instancePosition.y;

    gl_Position = u_viewMatrix * p;

    v_normal = rot * vec3(a_normal);
    v_normal = normalize(v_normal);

    v_instanceIndex = gl_InstanceID;

    v_color = texelFetch(u_colorPalettesTexture, ivec2(a_colorIndex, a_instanceColorPaletteIndex), 0).xyz;

    // v_color = vec3(float(a_colorIndex) / 5.0, float(a_colorIndex) / 5.0, float(a_colorIndex) / 5.0);

    // //
    // // debugger weight
    // if (false) {
    //     uvec3 debugIndexes = uvec3(1, 2, 0);
    //     vec3 debugWeights = vec3(0.0, 0.0, 0.0);
    //     if (a_boneIndexes[0] == debugIndexes[0]) {
    //         debugWeights[0] = a_boneWeights[0];
    //     } else if (a_boneIndexes[1] == debugIndexes[0]) {
    //         debugWeights[0] = a_boneWeights[1];
    //     } else if (a_boneIndexes[2] == debugIndexes[0]) {
    //         debugWeights[0] = a_boneWeights[2];
    //     } else if (a_boneIndexes[3] == debugIndexes[0]) {
    //         debugWeights[0] = a_boneWeights[3];
    //     }

    //     if (a_boneIndexes[0] == debugIndexes[1]) {
    //         debugWeights[1] = a_boneWeights[0];
    //     } else if (a_boneIndexes[1] == debugIndexes[1]) {
    //         debugWeights[1] = a_boneWeights[1];
    //     } else if (a_boneIndexes[2] == debugIndexes[1]) {
    //         debugWeights[1] = a_boneWeights[2];
    //     } else if (a_boneIndexes[3] == debugIndexes[1]) {
    //         debugWeights[1] = a_boneWeights[3];
    //     }

    //     if (a_boneIndexes[0] == debugIndexes[2]) {
    //         debugWeights[2] = a_boneWeights[0];
    //     } else if (a_boneIndexes[1] == debugIndexes[2]) {
    //         debugWeights[2] = a_boneWeights[1];
    //     } else if (a_boneIndexes[2] == debugIndexes[2]) {
    //         debugWeights[2] = a_boneWeights[2];
    //     } else if (a_boneIndexes[3] == debugIndexes[2]) {
    //         debugWeights[2] = a_boneWeights[3];
    //     }
    //     v_color = debugWeights;
    // }
}
