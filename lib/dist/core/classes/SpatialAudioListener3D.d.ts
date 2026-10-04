import { SpatialAudioListener3DOptions, Vector3 } from "../../typings";
/**
 * The point from which a SpatialAudioRenderer3D renders the scene.
 *
 * Uses a right-handed coordinate system with y up and -z forward by default,
 * the same as Web Audio and three.js. A camera can be followed by copying its
 * world position and direction every frame.
 */
export declare class SpatialAudioListener3D {
    id: string;
    position: Vector3;
    forward: Vector3;
    up: Vector3;
    /** Orthonormal basis derived from forward and up. Rebuilt when the orientation changes. */
    private basis;
    constructor(options?: Partial<SpatialAudioListener3DOptions>);
    setPosition(x: number, y: number, z: number): SpatialAudioListener3D;
    translate(dx: number, dy: number, dz: number): SpatialAudioListener3D;
    /**
     * Sets the facing direction and the up direction. Neither has to be normalized.
     */
    setOrientation(forward: Vector3, up?: Vector3): SpatialAudioListener3D;
    /**
     * Sets the orientation from yaw (around the y-axis) and pitch (up/down), in radians.
     * Yaw 0 and pitch 0 face -z. Positive yaw turns right, positive pitch looks up.
     */
    setYawPitch(yaw: number, pitch?: number): SpatialAudioListener3D;
    /**
     * Rotates the listener so it faces the given point, keeping the current up direction.
     */
    lookAt(x: number, y: number, z: number): SpatialAudioListener3D;
    get right(): Vector3;
    /**
     * Converts a world position into listener space. x = right, y = up, z = forward.
     */
    toLocal(position: Vector3): Vector3;
}
//# sourceMappingURL=SpatialAudioListener3D.d.ts.map