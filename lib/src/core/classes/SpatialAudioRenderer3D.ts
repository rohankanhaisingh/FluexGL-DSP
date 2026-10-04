import { SpatialAudioRenderer } from "./SpatialAudioRenderer";
import { SpatialAudioListener3D } from "./SpatialAudioListener3D";
import { SpatialAudioSource } from "./SpatialAudioSource";
import { SpatialAudioRenderer3DOptions, SpatialPanningModel, Vector3 } from "../../typings";

import type { AudioDevice } from "./AudioDevice";

/**
 * Renders a 3D scene of SpatialAudioSources relative to a single SpatialAudioListener3D.
 *
 * Voices are panned with a PannerNode. With the default "HRTF" panning model, sources
 * also get front/back and elevation cues, which works best on headphones. Because far
 * away sources are clustered, the number of (relatively expensive) HRTF panners stays low.
 *
 * Uses a right-handed coordinate system with y up and -z forward by default,
 * the same as Web Audio and three.js.
 *
 * @example
 * ```
 * const renderer = new SpatialAudioRenderer3D(audioDevice);
 * const source = renderer.createSource({ position: { x: 0, y: 2, z: -10 } });
 *
 * source.attachAudioClip(clip);
 * clip.play();
 *
 * renderer.start();
 * renderer.listener.setPosition(camera.x, camera.y, camera.z).setOrientation(cameraDirection);
 * ```
 */
export class SpatialAudioRenderer3D extends SpatialAudioRenderer {

    public listener: SpatialAudioListener3D = new SpatialAudioListener3D();

    protected panningModel: SpatialPanningModel = "HRTF";

    constructor(target: AudioDevice | AudioContext, options?: Partial<SpatialAudioRenderer3DOptions>) {

        const { panningModel, ...rest } = options ?? {};

        super(target, {
            refDistance: 1,
            maxDistance: 100,
            // HRTF panners are relatively expensive.
            maxVoices: 32,
            ...rest,
            clustering: {
                splitDistance: 15,
                mergeDistance: 20,
                ...rest.clustering
            }
        });

        this.panningModel = panningModel ?? this.panningModel;
    }

    public getPanningModel(): SpatialPanningModel {
        return this.panningModel;
    }

    /**
     * Changes how voices are panned. Existing voices are replaced with a short crossfade.
     */
    public setPanningModel(panningModel: SpatialPanningModel): SpatialAudioRenderer3D {

        if (panningModel === this.panningModel) return this;

        this.panningModel = panningModel;
        this.rebuildVoices();
        return this;
    }

    /**
     * Replaces the listener of this renderer. A renderer always has exactly one listener.
     */
    public setSpatialAudioListener(listener: SpatialAudioListener3D): SpatialAudioRenderer3D {
        this.listener = listener;
        return this;
    }

    protected toLocal(source: SpatialAudioSource): Vector3 {
        return this.listener.toLocal(source.position);
    }
}
