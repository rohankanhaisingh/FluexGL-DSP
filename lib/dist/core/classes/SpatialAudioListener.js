import { v4 } from "uuid";
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
    id = v4();
    position = { x: 0, y: 0 };
    /** Facing direction in radians, clockwise. 0 means facing up on the screen. */
    rotation = 0;
    /** Direction of the y-axis on screen. Kept in sync with the renderer this listener belongs to. */
    yAxis = "down";
    constructor(options) {
        if (options?.position)
            this.position = { x: options.position.x, y: options.position.y };
        if (options?.rotation !== undefined)
            this.rotation = options.rotation;
        if (options?.yAxis !== undefined)
            this.yAxis = options.yAxis;
    }
    setPosition(x, y) {
        this.position.x = x;
        this.position.y = y;
        return this;
    }
    translate(dx, dy) {
        this.position.x += dx;
        this.position.y += dy;
        return this;
    }
    setRotation(rotation) {
        this.rotation = rotation;
        return this;
    }
    /**
     * Rotates the listener so it faces the given point.
     */
    lookAt(x, y) {
        const dx = x - this.position.x;
        const dy = y - this.position.y;
        if (dx === 0 && dy === 0)
            return this;
        this.rotation = this.yAxis === "down" ? Math.atan2(dx, -dy) : Math.atan2(dx, dy);
        return this;
    }
    /** Unit vector of the facing direction, in world space. */
    get forward() {
        const sin = Math.sin(this.rotation);
        const cos = Math.cos(this.rotation);
        return this.yAxis === "down" ? { x: sin, y: -cos } : { x: sin, y: cos };
    }
    /** Unit vector pointing to the right of the listener, in world space. */
    get right() {
        const sin = Math.sin(this.rotation);
        const cos = Math.cos(this.rotation);
        return this.yAxis === "down" ? { x: cos, y: sin } : { x: cos, y: -sin };
    }
    /**
     * Converts a world position into listener space. x = right, y = up (always 0), z = forward.
     */
    toLocal(position) {
        const dx = position.x - this.position.x;
        const dy = position.y - this.position.y;
        const forward = this.forward;
        const right = this.right;
        return {
            x: dx * right.x + dy * right.y,
            y: 0,
            z: dx * forward.x + dy * forward.y
        };
    }
}
