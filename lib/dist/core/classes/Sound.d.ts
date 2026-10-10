import { AudioSourceData, SoundOptions, SoundPlayOptions } from "../../typings";
import type { Channel } from "./Channel";
import type { Master } from "./Master";
import type { SpatialAudioSource } from "./SpatialAudioSource";
/**
 * A sound effect for games: one decoded AudioBuffer, played as many lightweight instances.
 *
 * Unlike an AudioClip, a sound has no audio nodes of its own. Every instance is a single
 * AudioBufferSourceNode (plus a GainNode when it is not spatial), which is released as soon as it
 * has finished. The number of instances playing at the same time is limited per sound (see
 * {@link SoundOptions.maxInstances} and {@link SoundOptions.steal}), and starts that follow each
 * other too quickly are skipped (see {@link SoundOptions.minInterval}).
 *
 * @example
 * ```
 * const gunshot = await Sound.load(audioDevice, "/sfx/gunshot.wav", { maxInstances: 6, pitchVariation: 0.5 });
 *
 * gunshot.play(effectsBus);                          // not positioned, e.g. the player's own gun
 * renderer.playAt(gunshot, { x: 120, y: 0, z: -40 }); // positioned, e.g. another player's gun
 * ```
 */
export declare class Sound {
    id: string;
    buffer: AudioBuffer;
    options: SoundOptions;
    /** Instances that are playing, in the order they were started. */
    private instances;
    private lastStartTime;
    constructor(source: AudioBuffer | AudioSourceData, options?: Partial<SoundOptions>);
    /**
     * Fetches and decodes an audio file with the given AudioContext (or AudioDevice). The decoded
     * buffer is cached per context, so loading the same url again does not fetch or decode it again.
     */
    static load(target: BaseAudioContext | {
        context: BaseAudioContext;
    }, url: string, options?: Partial<SoundOptions>): Promise<Sound>;
    get duration(): number;
    /** Number of instances currently playing. */
    get playing(): number;
    /**
     * Plays the sound unpositioned on the given bus channel or master channel, for example UI sounds
     * or the sounds of the player itself. Returns null when the start was skipped (see minInterval, maxInstances).
     *
     * To play a sound from a game object, use SpatialAudioSource.play (an object with its own source)
     * or SpatialAudioRenderer.playAt (fire-and-forget at a position).
     */
    play(target: Channel | Master, options?: Partial<SoundPlayOptions>): SoundInstance | null;
    /**
     * Starts an instance. Used by {@link play}, SpatialAudioSource.play and SpatialAudioRenderer.playAt;
     * prefer those over calling this directly. Returns null when the start was skipped.
     */
    createInstance(target: SoundInstanceTarget): SoundInstance | null;
    /**
     * Stops all instances of this sound, with a short fade.
     */
    stopAll(fadeTime?: number): void;
    /** Called by an instance once it stops, so it no longer counts towards maxInstances. */
    remove(instance: SoundInstance): void;
    private makeRoom;
}
/**
 * Where a {@link SoundInstance} plays. Built by Sound.play, SpatialAudioSource.play and SpatialAudioRenderer.playAt.
 */
export interface SoundInstanceTarget {
    context: BaseAudioContext;
    /** Node the instance plays into. */
    destination: AudioNode;
    options?: Partial<SoundPlayOptions>;
    /**
     * The spatial source the instance is heard through. Looping instances are virtualized
     * (stopped and resumed) by the renderer when this source has no voice.
     */
    owner?: SpatialAudioSource | null;
    /**
     * Whether the instance has the owner to itself (SpatialAudioRenderer.playAt). The owner then carries the
     * volume, so the renderer can rank it against other sources, and its input gain is used to fade out.
     * Otherwise the instance gets a GainNode of its own.
     */
    exclusive?: boolean;
    /** Called once the instance has ended. */
    release?: (() => void) | null;
}
interface SoundInstancePlayback {
    volume: number;
    when: number;
    offset: number;
    playbackRate: number;
    loop: boolean;
}
/**
 * One playing instance of a {@link Sound}. Returned by Sound.play, SpatialAudioSource.play and SpatialAudioRenderer.playAt.
 * Once the instance has ended its audio nodes (and spatial source) are reused, so it can no longer be controlled.
 *
 * A looping instance can be suspended: its AudioBufferSourceNode is released while nobody can hear it,
 * and recreated at the right position in the loop once it is heard again. The renderer does this
 * automatically for sources without a voice (see SpatialAudioRendererOptions.loopVirtualizationDelay).
 */
export declare class SoundInstance {
    id: string;
    readonly sound: Sound;
    readonly startTime: number;
    readonly loop: boolean;
    private context;
    private node;
    /** Node the AudioBufferSourceNode is connected to. */
    private nodeDestination;
    private fader;
    private ownsFader;
    private owner;
    private exclusive;
    private release;
    private currentVolume;
    private startOffset;
    private playbackRate;
    private ended;
    private stopping;
    private suspended;
    private endedCallbacks;
    constructor(sound: Sound, target: SoundInstanceTarget, playback: SoundInstancePlayback);
    get isPlaying(): boolean;
    /** Whether the instance is a loop whose audio node is released because nobody can hear it. */
    get isSuspended(): boolean;
    get volume(): number;
    /**
     * The spatial source this instance is heard through, for example to let it follow a moving object.
     * Null when the instance is not positioned or has ended.
     */
    get source(): SpatialAudioSource | null;
    /** Loudness used to pick an instance to steal: the rendered gain when spatial, the volume otherwise. */
    get loudness(): number;
    /** Position in the buffer at the given context time, as if the instance had never been suspended. */
    private playhead;
    private spawn;
    setVolume(volume: number): SoundInstance;
    /**
     * Moves the spatial source of this instance. Only for instances started with SpatialAudioRenderer.playAt;
     * an instance started with SpatialAudioSource.play moves with its source.
     */
    setPosition(x: number, y: number, z?: number): SoundInstance;
    /**
     * Releases the audio node of a looping instance. The loop keeps running "virtually", and continues at
     * the right position on {@link resume}. Does nothing for one-shots, which are short enough to play out.
     */
    suspend(): void;
    /**
     * Recreates the audio node of a suspended loop, at the position the loop would have been at.
     */
    resume(): void;
    /**
     * Stops the instance after a short fade. A fade time of 0 stops it immediately.
     */
    stop(fadeTime?: number): void;
    onEnded(callback: () => void): SoundInstance;
    /** Releases the audio nodes, once the instance has ended or was stopped while suspended. */
    private finish;
}
export {};
//# sourceMappingURL=Sound.d.ts.map