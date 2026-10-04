import { SpatialAudioSource } from "./SpatialAudioSource";
import { SpatialPanningModel, Vector3 } from "../../typings";
export interface SpatialVoiceParameters {
    cutoff: number;
    /** Stereo pan, used by the "stereo" panning model. */
    pan: number;
    /** Direction in listener space (x = right, y = up, z = forward), used by the 3D panning models. */
    direction: Vector3;
    reverbSend: number;
}
/**
 * A voice is the actual DSP chain that spatializes audio:
 *
 *   [source taps] -> input -> lowpass -> panner -> output (dry)  -> master
 *                                              \-> reverbSend    -> reverb bus
 *
 * A voice either belongs to one source (individual), or is shared by
 * multiple far away sources in roughly the same direction (cluster).
 * The panner is a StereoPannerNode for the "stereo" panning model, or a
 * PannerNode (equalpower / HRTF) for the 3D panning models. The PannerNode
 * only handles direction; distance attenuation is done by the renderer.
 *
 * Every source keeps its own gain stage, so the loudness of each member
 * stays exact. Only the filter, panning and reverb send are shared.
 *
 * This class is managed by SpatialAudioRenderer2D and is not meant to be
 * used directly.
 */
export declare class SpatialAudioVoice {
    context: AudioContext;
    isCluster: boolean;
    panningModel: SpatialPanningModel;
    id: string;
    members: Set<SpatialAudioSource>;
    input: GainNode;
    filter: BiquadFilterNode;
    panner: StereoPannerNode | PannerNode;
    output: GainNode;
    reverbSend: GainNode;
    /** Cluster centre as seen from the listener (unit vector in listener space). Only meaningful for cluster voices. */
    centroidDirection: Vector3;
    centroidDistance: number;
    /** Audio context time from which a pooled voice may be reused (its last tails have faded out). */
    availableAt: number;
    private taps;
    private hasParameters;
    private disposed;
    /** Last values sent to the audio thread, used to skip changes too small to hear. */
    private sent;
    constructor(context: AudioContext, isCluster: boolean, panningModel: SpatialPanningModel, dryDestination: AudioNode, reverbDestination: AudioNode);
    get size(): number;
    has(source: SpatialAudioSource): boolean;
    /**
     * Connects the output of a source to this voice, fading it in. A crossfade time of 0
     * connects it at full level immediately, which keeps the attack of new sounds intact.
     */
    attach(source: SpatialAudioSource, crossfadeTime: number): void;
    /**
     * Fades the source out of this voice, and disconnects it afterwards.
     */
    detach(source: SpatialAudioSource, crossfadeTime: number): void;
    /**
     * Applies the parameters. Every automation call is a message to the audio thread, so a
     * parameter is only sent when it changed by more than an inaudible amount. With many
     * sources this keeps the audio thread from being flooded by automation events.
     */
    setParameters(parameters: SpatialVoiceParameters, smoothing: number): void;
    /**
     * Prepares an empty voice for reuse from the pool. The audio nodes stay connected;
     * the next setParameters() jumps straight to the new values.
     */
    recycle(isCluster: boolean): void;
    /**
     * Detaches all members and disconnects the voice once the crossfade has finished.
     */
    dispose(crossfadeTime: number): void;
}
//# sourceMappingURL=SpatialAudioVoice.d.ts.map