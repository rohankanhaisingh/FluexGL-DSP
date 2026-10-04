import { Master } from "./Master";
import { Channel } from "./Channel";
import { Effector } from "./Effector";
import { SpatialAudioSource } from "./SpatialAudioSource";
import { SpatialAudioVoice } from "./SpatialAudioVoice";
import { Limiter } from "../../effects/classes/Limiter";
import { SpatialAudioRendererOptions, SpatialAudioSourceOptions, SpatialClusteringOptions, SpatialPanningModel, SpatialSourceState, Vector3 } from "../../typings";
import type { AudioDevice } from "./AudioDevice";
export type ResolvedSpatialRendererOptions = Omit<SpatialAudioRendererOptions, "clustering" | "limiter">;
export interface SpatialRendererStats {
    sources: number;
    audible: number;
    /** Audible sources without a voice, because the voice budget is in use by louder sources. */
    virtual: number;
    voices: number;
    clusters: number;
    /** Empty voices kept for reuse. */
    pooledVoices: number;
}
export interface SpatialClusterInfo {
    voiceId: string;
    isCluster: boolean;
    sourceIds: string[];
    azimuth: number;
    elevation: number;
    distance: number;
}
/**
 * Shared implementation of the 2D and 3D spatial audio renderers.
 *
 * Every renderer has its own master channel. Per source, the distance to the listener
 * determines the volume, the cutoff of a lowpass filter (air absorption) and the amount
 * of reverb. The direction determines the panning.
 *
 * Far away sources that are in roughly the same direction are clustered: they share a
 * single voice (lowpass, panner and reverb send). Once the listener comes close, the
 * cluster is split again and every source gets its own voice.
 *
 * Subclasses only have to convert a source position into listener space.
 */
export declare abstract class SpatialAudioRenderer {
    id: string;
    label: string | null;
    context: AudioContext;
    master: Master;
    /** Bus that receives the reverb sends of all voices. Sent into the master channel. */
    reverbChannel: Channel;
    reverbEffect: Effector | null;
    /** Safety limiter on the master channel, so many sources at once do not clip. Null when disabled. */
    limiter: Limiter | null;
    sources: SpatialAudioSource[];
    voices: SpatialAudioVoice[];
    options: ResolvedSpatialRendererOptions;
    clustering: SpatialClusteringOptions;
    /** Panning model used for newly created voices. */
    protected abstract panningModel: SpatialPanningModel;
    /** Empty voices kept for reuse, so voices (and their HRTF panners) are not constantly recreated. */
    private voicePool;
    private useDefaultReverb;
    private animationFrameId;
    private intervalId;
    constructor(target: AudioDevice | AudioContext, options?: Partial<SpatialAudioRendererOptions>);
    /**
     * Converts the position of a source into listener space. x = right, y = up, z = forward.
     */
    protected abstract toLocal(source: SpatialAudioSource): Vector3;
    /**
     * The default reverb runs on an AudioWorklet, which requires WebAssembly. Until the
     * DSP pipeline is initialized the reverb bus stays muted, after which the default
     * reverb is attached automatically, unless a custom effect has been set.
     */
    private ensureDefaultReverb;
    private validateClusteringOptions;
    /**
     * Replaces the effect on the reverb bus. Passing null removes the reverb, and mutes the bus.
     */
    setReverbEffect(effect: Effector | null): this;
    private applyReverbEffect;
    createSource(options?: Partial<SpatialAudioSourceOptions>): SpatialAudioSource;
    addSource(source: SpatialAudioSource): this;
    /**
     * Renders a newly added source right away, without fading in, so a clip played
     * directly after adding the source keeps its attack (for example a gunshot).
     * The next update() may still move it into a cluster, with a crossfade.
     */
    private prepareSource;
    /**
     * Removes the source from the renderer. By default the source is disposed as well.
     */
    removeSource(source: SpatialAudioSource, dispose?: boolean): this;
    /**
     * Calculates the position of a source relative to the listener.
     */
    computeSourceState(source: SpatialAudioSource): SpatialSourceState;
    /**
     * Updates all sources and voices. Call this once per frame from your own loop,
     * or use .start() to let the renderer update itself.
     */
    update(): this;
    /**
     * Starts updating the renderer every animation frame.
     */
    start(): this;
    stop(): this;
    get isRunning(): boolean;
    /**
     * Returns how sources are currently grouped into voices. Useful for debugging and visualization.
     */
    getClusters(): SpatialClusterInfo[];
    /**
     * Returns counters that show how the renderer is doing. Useful for debugging and tuning maxVoices.
     */
    getStats(): SpatialRendererStats;
    /**
     * Throws away all voices. They are rebuilt (with crossfades) on the next update,
     * for example after the panning model has changed.
     */
    protected rebuildVoices(): void;
    dispose(): void;
    private resolveAttenuation;
    private computeSourceParameters;
    private isClusterCandidate;
    /**
     * Whether a source is close enough (in direction and distance) to a cluster centre.
     * `cosLimit` is the cosine of the maximum angle, so no acos is needed per comparison.
     */
    private fitsCluster;
    /**
     * Decides which voice every source should be rendered by, and moves sources between voices.
     */
    private assignVoices;
    private activeVoiceCount;
    /** Loudness of a voice: the summed gain of its sources. */
    private voiceLoudness;
    /** The quietest voice in use, cluster or not. */
    private quietestVoice;
    private releaseAllMembers;
    /**
     * The loudness a new voice needs to get a voice: 0 while the budget has room, otherwise
     * clearly louder than the quietest voice in use.
     */
    private stealThreshold;
    /**
     * Makes room for one new voice with the given loudness. When the budget is used up, the quietest
     * voice is released, but only when the new voice is clearly louder (prevents voices from flapping).
     * Returns false when there is no room.
     */
    private reserveVoice;
    /**
     * Gives an audible source its own voice, if the voice budget allows it. When the budget is used up,
     * the source takes over the quietest voice, but only when it is clearly louder.
     * Returns the new voice, or null when the source stays virtual.
     */
    private giveVoice;
    private createVoice;
    private poolVoice;
    private moveSourceToVoice;
    private releaseVoice;
}
//# sourceMappingURL=SpatialAudioRenderer.d.ts.map