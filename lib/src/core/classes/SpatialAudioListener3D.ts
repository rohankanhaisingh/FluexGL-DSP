import { v4 } from "uuid";

import { SpatialAudioListener3DOptions, Vector3 } from "../../typings";

/**
 * The point from which a SpatialAudioRenderer3D renders the scene.
 *
 * Uses a right-handed coordinate system with y up and -z forward by default,
 * the same as Web Audio and three.js. A camera can be followed by copying its
 * world position and direction every frame.
 */
export class SpatialAudioListener3D {

    public id: string = v4();

    public position: Vector3 = { x: 0, y: 0, z: 0 };
    public forward: Vector3 = { x: 0, y: 0, z: -1 };
    public up: Vector3 = { x: 0, y: 1, z: 0 };

    /** Orthonormal basis derived from forward and up. Rebuilt when the orientation changes. */
    private basis: { right: Vector3, up: Vector3, forward: Vector3 } = {
        right: { x: 1, y: 0, z: 0 },
        up: { x: 0, y: 1, z: 0 },
        forward: { x: 0, y: 0, z: -1 }
    };

    constructor(options?: Partial<SpatialAudioListener3DOptions>) {

        if (options?.position) this.position = { ...options.position };

        this.setOrientation(options?.forward ?? this.forward, options?.up ?? this.up);
    }

    public setPosition(x: number, y: number, z: number): SpatialAudioListener3D {
        this.position.x = x;
        this.position.y = y;
        this.position.z = z;
        return this;
    }

    public translate(dx: number, dy: number, dz: number): SpatialAudioListener3D {
        this.position.x += dx;
        this.position.y += dy;
        this.position.z += dz;
        return this;
    }

    /**
     * Sets the facing direction and the up direction. Neither has to be normalized.
     */
    public setOrientation(forward: Vector3, up: Vector3 = this.up): SpatialAudioListener3D {

        const f: Vector3 = normalize(forward, { x: 0, y: 0, z: -1 });
        let r: Vector3 = cross(f, normalize(up, { x: 0, y: 1, z: 0 }));

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
    public setYawPitch(yaw: number, pitch: number = 0): SpatialAudioListener3D {

        const cp: number = Math.cos(pitch);

        return this.setOrientation({
            x: Math.sin(yaw) * cp,
            y: Math.sin(pitch),
            z: -Math.cos(yaw) * cp
        }, { x: 0, y: 1, z: 0 });
    }

    /**
     * Rotates the listener so it faces the given point, keeping the current up direction.
     */
    public lookAt(x: number, y: number, z: number): SpatialAudioListener3D {

        const direction: Vector3 = { x: x - this.position.x, y: y - this.position.y, z: z - this.position.z };

        if (length(direction) < 1e-9) return this;

        return this.setOrientation(direction, { x: 0, y: 1, z: 0 });
    }

    public get right(): Vector3 {
        return { ...this.basis.right };
    }

    /**
     * Converts a world position into listener space. x = right, y = up, z = forward.
     */
    public toLocal(position: Vector3): Vector3 {

        const d: Vector3 = {
            x: position.x - this.position.x,
            y: position.y - this.position.y,
            z: position.z - this.position.z
        };

        return {
            x: dot(d, this.basis.right),
            y: dot(d, this.basis.up),
            z: dot(d, this.basis.forward)
        }
    }
}

function dot(a: Vector3, b: Vector3): number {
    return a.x * b.x + a.y * b.y + a.z * b.z;
}

function cross(a: Vector3, b: Vector3): Vector3 {
    return {
        x: a.y * b.z - a.z * b.y,
        y: a.z * b.x - a.x * b.z,
        z: a.x * b.y - a.y * b.x
    }
}

function length(v: Vector3): number {
    return Math.hypot(v.x, v.y, v.z);
}

function normalize(v: Vector3, fallback: Vector3): Vector3 {

    const l: number = length(v);

    return l < 1e-9 ? { ...fallback } : { x: v.x / l, y: v.y / l, z: v.z / l };
}
