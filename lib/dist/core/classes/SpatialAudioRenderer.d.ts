import { Master } from "./Master";
import { Channel } from "./Channel";
import { Effector } from "./Effector";
import { SpatialAudioSource } from "./SpatialAudioSource";
import { SpatialAudioVoice } from "./SpatialAudioVoice";
import type { Sound, SoundInstance } from "./Sound";
import { Limiter } from "../../effects/classes/Limiter";
import { SpatialAudioRendererOptions, SpatialAudioSourceOptions, SpatialClusteringOptions, SpatialPanningModel, SpatialSourceState, SoundPlayAtOptions, Vector2, Vector3 } from "../../typings";
import type { AudioDevice } from "./AudioDevice";
export type ResolvedSpatialRendererOptions = Omit<SpatialAudioRendererOptions, "clustering" | "limiter" | "output">;
export interface SpatialRendererStats {
    sources: number;
    audible: number;
    /** Audible sources without a voice, because the voice budget is in use by louder sources. */
    virtual: number;
    voices: number;
    clusters: number;
    /** Empty voices kept for reuse. */
    pooledVoices: number;
    /** Looping sound instances whose audio node is released, because their source has no voice. */
    suspendedLoops: number;
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
 * The renderer sends its sound to its own master channel, or to the `output` given in the options
 * (for example a bus channel). Every source can be routed to its own bus as well (see
 * {@link SpatialAudioSource.bus}); sources only share a voice with sources on the same bus. Per source, the distance to the listener
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
    /** The master channel of the renderer. Null when the output given in the options is a (bus) channel. */
    master: Master | null;
    /** Where the sound (and reverb) of the renderer goes, unless a source has a bus of its own. */
    output: Channel | Master;
    /** Bus that receives the reverb sends of all voices. Sent into the output. */
    reverbChannel: Channel;
    reverbEffect: Effector | null;
    /** Safety limiter on the output, so many sources at once do not clip. Null when disabled. */
    limiter: Limiter | null;
    sources: SpatialAudioSource[];
    voices: SpatialAudioVoice[];
    options: ResolvedSpatialRendererOptions;
    clustering: SpatialClusteringOptions;
    /** Panning model used for newly created voices. */
    protected abstract panningModel: SpatialPanningModel;
    /** Empty voices kept for reuse, so voices (and their HRTF panners) are not constantly recreated. */
    private voicePool;
    /** Sources kept for reuse by playAt(), so one-shots do not create audio nodes every time. */
    private sourcePool;
    private disposed;
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
    /**
     * Plays a sound at a position, fire-and-forget: for sounds that do not belong to a long-living
     * object, such as explosions, impacts, collisions and bullet hits. The source is borrowed from a
     * pool and returned once the sound has ended.
     *
     * One-shots that are inaudible when they start (too far away) are skipped entirely, unless
     * `cull` is false. Returns null when the sound was skipped, either because of that or because
     * of the limits of the sound (maxInstances, minInterval).
     *
     * @example
     * ```
     * renderer.playAt(explosion, { x: 400, y: 0, z: -900 }, { bus: effectsBus });
     *
     * // A sound that follows a moving object:
     * const whoosh = renderer.playAt(rocketLoop, rocket.position, { loop: true });
     * whoosh?.setPosition(rocket.x, rocket.y, rocket.z); // every frame
     * whoosh?.stop(0.1);                                // on impact
     * ```
     */
    playAt(sound: Sound, position: Vector2 | Vector3, options?: Partial<SoundPlayAtOptions>): SoundInstance | null;
    /**
     * Removes a source borrowed by playAt(), and puts it back in the pool once its voice has faded out.
     */
    private recycleSource;
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
     * Suspends the looping sounds of sources that have been without a voice for a while, and resumes
     * them once the source has a voice again. Nobody hears a source without a voice, so there is no
     * reason to keep its AudioBufferSourceNodes running.
     */
    private virtualizeLoops;
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
    /**
     * The node the dry sound of a source goes to: the input of its bus, or the output of the renderer.
     */
    private resolveDestination;
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