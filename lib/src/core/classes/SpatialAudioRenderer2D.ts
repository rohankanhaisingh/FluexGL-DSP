import { SpatialAudioRenderer } from "./SpatialAudioRenderer";
import { SpatialAudioListener } from "./SpatialAudioListener";
import { SpatialAudioSource } from "./SpatialAudioSource";
import { SpatialAudioRenderer2DOptions, SpatialPanningModel, SpatialYAxisDirection, Vector3 } from "../../typings";

import type { AudioDevice } from "./AudioDevice";

/**
 * Renders a 2D scene of SpatialAudioSources relative to a single SpatialAudioListener.
 * Sources are panned left/right with a StereoPannerNode. The z coordinate of sources is ignored.
 *
 * The listener rotation is optional: with the default rotation of 0 the listener faces up
 * on the screen, so left and right on the screen are left and right in the stereo image.
 * For side-scrollers, set rearLowpassFactor to 1 so sources below the listener are not
 * treated as being behind it.
 *
 * @example
 * ```
 * const renderer = new SpatialAudioRenderer2D(audioDevice);
 * const source = renderer.createSource({ position: { x: 200, y: 0 } });
 *
 * source.attachAudioClip(clip);
 * clip.play();
 *
 * renderer.start();
 * renderer.listener.setPosition(100, 0);
 * ```
 */
export class SpatialAudioRenderer2D extends SpatialAudioRenderer {

    public listener: SpatialAudioListener = new SpatialAudioListener();
    public yAxis: SpatialYAxisDirection = "down";

    protected panningModel: SpatialPanningModel = "stereo";

    constructor(target: AudioDevice | AudioContext, options?: Partial<SpatialAudioRenderer2DOptions>) {

        const { yAxis, ...rest } = options ?? {};

        super(target, rest);

        this.yAxis = yAxis ?? this.yAxis;
        this.listener.yAxis = this.yAxis;
    }

    /**
     * Replaces the listener of this renderer. A renderer always has exactly one listener.
     */
    public setSpatialAudioListener(listener: SpatialAudioListener): SpatialAudioRenderer2D {
        listener.yAxis = this.yAxis;
        this.listener = listener;
        return this;
    }

    protected toLocal(source: SpatialAudioSource): Vector3 {
        return this.listener.toLocal(source.position);
    }
}
