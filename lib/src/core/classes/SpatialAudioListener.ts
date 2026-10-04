import { v4 } from "uuid";

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
export class SpatialAudioListener {

    public id: string = v4();

    public position: Vector2 = { x: 0, y: 0 };

    /** Facing direction in radians, clockwise. 0 means facing up on the screen. */
    public rotation: number = 0;

    /** Direction of the y-axis on screen. Kept in sync with the renderer this listener belongs to. */
    public yAxis: SpatialYAxisDirection = "down";

    constructor(options?: Partial<SpatialAudioListenerOptions>) {

        if (options?.position) this.position = { x: options.position.x, y: options.position.y };
        if (options?.rotation !== undefined) this.rotation = options.rotation;
        if (options?.yAxis !== undefined) this.yAxis = options.yAxis;
    }

    public setPosition(x: number, y: number): SpatialAudioListener {
        this.position.x = x;
        this.position.y = y;
        return this;
    }

    public translate(dx: number, dy: number): SpatialAudioListener {
        this.position.x += dx;
        this.position.y += dy;
        return this;
    }

    public setRotation(rotation: number): SpatialAudioListener {
        this.rotation = rotation;
        return this;
    }

    /**
     * Rotates the listener so it faces the given point.
     */
    public lookAt(x: number, y: number): SpatialAudioListener {

        const dx: number = x - this.position.x;
        const dy: number = y - this.position.y;

        if (dx === 0 && dy === 0) return this;

        this.rotation = this.yAxis === "down" ? Math.atan2(dx, -dy) : Math.atan2(dx, dy);
        return this;
    }

    /** Unit vector of the facing direction, in world space. */
    public get forward(): Vector2 {

        const sin: number = Math.sin(this.rotation);
        const cos: number = Math.cos(this.rotation);

        return this.yAxis === "down" ? { x: sin, y: -cos } : { x: sin, y: cos };
    }

    /** Unit vector pointing to the right of the listener, in world space. */
    public get right(): Vector2 {

        const sin: number = Math.sin(this.rotation);
        const cos: number = Math.cos(this.rotation);

        return this.yAxis === "down" ? { x: cos, y: sin } : { x: cos, y: -sin };
    }

    /**
     * Converts a world position into listener space. x = right, y = up (always 0), z = forward.
     */
    public toLocal(position: Vector2): Vector3 {

        const dx: number = position.x - this.position.x;
        const dy: number = position.y - this.position.y;

        const forward: Vector2 = this.forward;
        const right: Vector2 = this.right;

        return {
            x: dx * right.x + dy * right.y,
            y: 0,
            z: dx * forward.x + dy * forward.y
        }
    }
}
