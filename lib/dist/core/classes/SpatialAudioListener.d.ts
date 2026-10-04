import { SpatialAudioListenerOptions, SpatialYAxisDirection, Vector2, Vector3 } from "../../typings";
/**
 * The point from which a SpatialAudioRenderer2D renders the scene.
 * Every renderer has exactly one listener. All sources are
 * attenuated, filtered and panned relative to this listener.
 *
 * The rotation is optional. With the default rotation of 0 the listener
 * faces up on the screen, so sources on the left and right of the screen
 * are panned left and right.
 */
export declare class SpatialAudioListener {
    id: string;
    position: Vector2;
    /** Facing direction in radians, clockwise. 0 means facing up on the screen. */
    rotation: number;
    /** Direction of the y-axis on screen. Kept in sync with the renderer this listener belongs to. */
    yAxis: SpatialYAxisDirection;
    constructor(options?: Partial<SpatialAudioListenerOptions>);
    setPosition(x: number, y: number): SpatialAudioListener;
    translate(dx: number, dy: number): SpatialAudioListener;
    setRotation(rotation: number): SpatialAudioListener;
    /**
     * Rotates the listener so it faces the given point.
     */
    lookAt(x: number, y: number): SpatialAudioListener;
    /** Unit vector of the facing direction, in world space. */
    get forward(): Vector2;
    /** Unit vector pointing to the right of the listener, in world space. */
    get right(): Vector2;
    /**
     * Converts a world position into listener space. x = right, y = up (always 0), z = forward.
     */
    toLocal(position: Vector2): Vector3;
}
//# sourceMappingURL=SpatialAudioListener.d.ts.map