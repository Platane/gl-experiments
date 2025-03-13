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
in vec4 a_instancePoseWeights;
in uvec4 a_instancePoseIndexes;

// uniforms
uniform mat4 u_viewMatrix;
uniform sampler2D u_posesTexture;
uniform sampler2D u_colorPalettesTexture;

out vec3 v_normal;
out vec3 v_color;
flat out int v_instanceIndex;

//
// read the transform for the bone <boneIndex> of the pose <poseIndex>
mat4 getBoneMatrix(sampler2D posesTexture, uint poseIndex, uint boneIndex) {
    return mat4(
        texelFetch(posesTexture, ivec2(4 * int(boneIndex) + 0, int(poseIndex)), 0),
        texelFetch(posesTexture, ivec2(4 * int(boneIndex) + 1, int(poseIndex)), 0),
        texelFetch(posesTexture, ivec2(4 * int(boneIndex) + 2, int(poseIndex)), 0),
        texelFetch(posesTexture, ivec2(4 * int(boneIndex) + 3, int(poseIndex)), 0)
    );
}

//
// compute the interpolated transform for a point with the given boneIndexes / bonesWeights in a pose
mat4 getSkinTransform(sampler2D posesTexture, uint poseIndex, uvec4 boneIndexes, vec4 boneWeights) {
    return getBoneMatrix(posesTexture, poseIndex, boneIndexes[0]) * boneWeights[0] +
        getBoneMatrix(posesTexture, poseIndex, boneIndexes[1]) * boneWeights[1] +
        getBoneMatrix(posesTexture, poseIndex, boneIndexes[2]) * boneWeights[2] +
        getBoneMatrix(posesTexture, poseIndex, boneIndexes[3]) * boneWeights[3];
}
mat4 getSkinTransform(sampler2D posesTexture, uint poseIndex, uvec2 boneIndexes, vec2 boneWeights) {
    return getBoneMatrix(posesTexture, poseIndex, boneIndexes[0]) * boneWeights[0] +
        getBoneMatrix(posesTexture, poseIndex, boneIndexes[1]) * boneWeights[1];
}

//
// compute the interpolated transform for a point with the given boneIndexes / bonesWeights , with a given  poseIndexes / poseWeights
mat4 getAnimatedSkinTransform(sampler2D posesTexture, uvec4 poseIndexes, vec4 poseWeights, uvec4 boneIndexes, vec4 boneWeights) {
    return getSkinTransform(posesTexture, poseIndexes[0], boneIndexes, boneWeights) * poseWeights[0] +
        getSkinTransform(posesTexture, poseIndexes[1], boneIndexes, boneWeights) * poseWeights[1] +
        getSkinTransform(posesTexture, poseIndexes[2], boneIndexes, boneWeights) * poseWeights[2] +
        getSkinTransform(posesTexture, poseIndexes[3], boneIndexes, boneWeights) * poseWeights[3];
}
mat4 getAnimatedSkinTransform(sampler2D posesTexture, uvec4 poseIndexes, vec4 poseWeights, uvec2 boneIndexes, vec2 boneWeights) {
    return getSkinTransform(posesTexture, poseIndexes[0], boneIndexes, boneWeights) * poseWeights[0] +
        getSkinTransform(posesTexture, poseIndexes[1], boneIndexes, boneWeights) * poseWeights[1] +
        getSkinTransform(posesTexture, poseIndexes[2], boneIndexes, boneWeights) * poseWeights[2] +
        getSkinTransform(posesTexture, poseIndexes[3], boneIndexes, boneWeights) * poseWeights[3];
}
mat4 getAnimatedSkinTransform(sampler2D posesTexture, uvec2 poseIndexes, vec2 poseWeights, uvec4 boneIndexes, vec4 boneWeights) {
    return getSkinTransform(posesTexture, poseIndexes[0], boneIndexes, boneWeights) * poseWeights[0] +
        getSkinTransform(posesTexture, poseIndexes[1], boneIndexes, boneWeights) * poseWeights[1];
}
mat4 getAnimatedSkinTransform(sampler2D posesTexture, uvec2 poseIndexes, vec2 poseWeights, uvec2 boneIndexes, vec2 boneWeights) {
    return getSkinTransform(posesTexture, poseIndexes[0], boneIndexes, boneWeights) * poseWeights[0] +
        getSkinTransform(posesTexture, poseIndexes[1], boneIndexes, boneWeights) * poseWeights[1];
}

void main() {
    mat4 bm = getAnimatedSkinTransform(
            u_posesTexture,
            a_instancePoseIndexes,
            a_instancePoseWeights,
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
