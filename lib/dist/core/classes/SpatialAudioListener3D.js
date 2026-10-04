import { v4 } from "uuid";
/**
 * The point from which a SpatialAudioRenderer3D renders the scene.
 *
 * Uses a right-handed coordinate system with y up and -z forward by default,
 * the same as Web Audio and three.js. A camera can be followed by copying its
 * world position and direction every frame.
 */
export class SpatialAudioListener3D {
    id = v4();
    position = { x: 0, y: 0, z: 0 };
    forward = { x: 0, y: 0, z: -1 };
    up = { x: 0, y: 1, z: 0 };
    /** Orthonormal basis derived from forward and up. Rebuilt when the orientation changes. */
    basis = {
        right: { x: 1, y: 0, z: 0 },
        up: { x: 0, y: 1, z: 0 },
        forward: { x: 0, y: 0, z: -1 }
    };
    constructor(options) {
        if (options?.position)
            this.position = { ...options.position };
        this.setOrientation(options?.forward ?? this.forward, options?.up ?? this.up);
    }
    setPosition(x, y, z) {
        this.position.x = x;
        this.position.y = y;
        this.position.z = z;
        return this;
    }
    translate(dx, dy, dz) {
        this.position.x += dx;
        this.position.y += dy;
        this.position.z += dz;
        return this;
    }
    /**
     * Sets the facing direction and the up direction. Neither has to be normalized.
     */
    setOrientation(forward, up = this.up) {
        const f = normalize(forward, { x: 0, y: 0, z: -1 });
        let r = cross(f, normalize(up, { x: 0, y: 1, z: 0 }));
        // Forward and up are parallel; pick any perpendicular right vector.
        if (length(r) < 1e-6)
            r = cross(f, Math.abs(f.y) < 0.99 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 });
        r = normalize(r, { x: 1, y: 0, z: 0 });
        this.forward = f;
        this.up = cross(r, f);
        this.basis = { right: r, up: this.up, forward: f };
        return this;
    }
    /**
     * Sets the orientation from yaw (around the y-axis) and pitch (up/down), in radians.
     * Yaw 0 and pitch 0 face -z. Positive yaw turns right, positive pitch looks up.
     */
    setYawPitch(yaw, pitch = 0) {
        const cp = Math.cos(pitch);
        return this.setOrientation({
            x: Math.sin(yaw) * cp,
            y: Math.sin(pitch),
            z: -Math.cos(yaw) * cp
        }, { x: 0, y: 1, z: 0 });
    }
    /**
     * Rotates the listener so it faces the given point, keeping the current up direction.
     */
    lookAt(x, y, z) {
        const direction = { x: x - this.position.x, y: y - this.position.y, z: z - this.position.z };
        if (length(direction) < 1e-9)
            return this;
        return this.setOrientation(direction, { x: 0, y: 1, z: 0 });
    }
    get right() {
        return { ...this.basis.right };
    }
    /**
     * Converts a world position into listener space. x = right, y = up, z = forward.
     */
    toLocal(position) {
        const d = {
            x: position.x - this.position.x,
            y: position.y - this.position.y,
            z: position.z - this.position.z
        };
        return {
            x: dot(d, this.basis.right),
            y: dot(d, this.basis.up),
            z: dot(d, this.basis.forward)
        };
    }
}
function dot(a, b) {
    return a.x * b.x + a.y * b.y + a.z * b.z;
}
function cross(a, b) {
    return {
        x: a.y * b.z - a.z * b.y,
        y: a.z * b.x - a.x * b.z,
        z: a.x * b.y - a.y * b.x
    };
}
function length(v) {
    return Math.hypot(v.x, v.y, v.z);
}
function normalize(v, fallback) {
    const l = length(v);
    return l < 1e-9 ? { ...fallback } : { x: v.x / l, y: v.y / l, z: v.z / l };
}
