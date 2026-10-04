import { SpatialAudioRenderer } from "./SpatialAudioRenderer";
import { SpatialAudioListener3D } from "./SpatialAudioListener3D";
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
    listener = new SpatialAudioListener3D();
    panningModel = "HRTF";
    constructor(target, options) {
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
    getPanningModel() {
        return this.panningModel;
    }
    /**
     * Changes how voices are panned. Existing voices are replaced with a short crossfade.
     */
    setPanningModel(panningModel) {
        if (panningModel === this.panningModel)
            return this;
        this.panningModel = panningModel;
        this.rebuildVoices();
        return this;
    }
    /**
     * Replaces the listener of this renderer. A renderer always has exactly one listener.
     */
    setSpatialAudioListener(listener) {
        this.listener = listener;
        return this;
    }
    toLocal(source) {
        return this.listener.toLocal(source.position);
    }
}
