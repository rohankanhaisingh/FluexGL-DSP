import { v4 } from "uuid";

import { Debug } from "../../utilities/debugger";
import { ErrorCodes } from "../../console-codes";
import { AudioSourceData, SoundOptions, SoundPlayOptions, SoundStealMode } from "../../typings";

import type { Channel } from "./Channel";
import type { Master } from "./Master";
import type { SpatialAudioSource } from "./SpatialAudioSource";

/** Fade used when an instance is stolen, short enough to be inaudible but long enough to avoid a click. */
const STEAL_FADE_TIME: number = 0.02;

/** Decoded buffers per context and url, so a file is only fetched and decoded once. */
const bufferCache: WeakMap<BaseAudioContext, Map<string, Promise<AudioBuffer>>> = new WeakMap();

const DEFAULT_OPTIONS: SoundOptions = {
    label: null,
    volume: 1,
    volumeVariation: 0,
    pitch: 0,
    pitchVariation: 0,
    maxInstances: 8,
    steal: "oldest",
    minInterval: 0,
    loop: false
}

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
export class Sound {

    public id: string = v4();
    public buffer: AudioBuffer;
    public options: SoundOptions;

    /** Instances that are playing, in the order they were started. */
    private instances: SoundInstance[] = [];
    private lastStartTime: number = -Infinity;

    constructor(source: AudioBuffer | AudioSourceData, options?: Partial<SoundOptions>) {
        this.buffer = source instanceof AudioBuffer ? source : source.audioBuffer;
        this.options = { ...DEFAULT_OPTIONS, ...options };
    }

    /**
     * Fetches and decodes an audio file with the given AudioContext (or AudioDevice). The decoded
     * buffer is cached per context, so loading the same url again does not fetch or decode it again.
     */
    public static async load(target: BaseAudioContext | { context: BaseAudioContext }, url: string, options?: Partial<SoundOptions>): Promise<Sound> {

        const context: BaseAudioContext = target instanceof BaseAudioContext ? target : target.context;

        let cache = bufferCache.get(context);

        if (!cache) {
            cache = new Map();
            bufferCache.set(context, cache);
        }

        let pending: Promise<AudioBuffer> | undefined = cache.get(url);

        if (!pending) {
            pending = fetch(url).then(function (response: Response) {

                if (!response.ok) throw new Error(`Could not load sound "${url}". Received status code: ${response.status}.`);

                return response.arrayBuffer();
            }).then(function (arrayBuffer: ArrayBuffer) {
                return context.decodeAudioData(arrayBuffer);
            });

            cache.set(url, pending);

            // A failed load should not stay cached, so it can be retried.
            pending.catch(() => cache.delete(url));
        }

        try {
            return new Sound(await pending, { label: url, ...options });
        } catch (error) {
            Debug.error("The sound could not be loaded.", [
                `Url: ${url}`,
                `${error}`
            ], ErrorCodes.PATH_TO_FILE_NOT_FOUND);
            throw error;
        }
    }

    public get duration(): number {
        return this.buffer.duration;
    }

    /** Number of instances currently playing. */
    public get playing(): number {
        return this.instances.length;
    }


    /**
     * Plays the sound unpositioned on the given bus channel or master channel, for example UI sounds
     * or the sounds of the player itself. Returns null when the start was skipped (see minInterval, maxInstances).
     *
     * To play a sound from a game object, use SpatialAudioSource.play (an object with its own source)
     * or SpatialAudioRenderer.playAt (fire-and-forget at a position).
     */
    public play(target: Channel | Master, options?: Partial<SoundPlayOptions>): SoundInstance | null {

        if (!target.context || !target.input) {
            Debug.error("Could not play sound, because the target channel is not initialized.", [
                `Sound: ${this.options.label ?? this.id}`
            ], ErrorCodes.CHANNEL_NOT_INITIALIZED);
            return null;
        }

        return this.createInstance({ context: target.context, destination: target.input, options });
    }

    /**
     * Starts an instance. Used by {@link play}, SpatialAudioSource.play and SpatialAudioRenderer.playAt;
     * prefer those over calling this directly. Returns null when the start was skipped.
     */
    public createInstance(target: SoundInstanceTarget): SoundInstance | null {

        const o: SoundOptions = this.options;
        const options: Partial<SoundPlayOptions> = target.options ?? {};
        const context: BaseAudioContext = target.context;
        const when: number = Math.max(options.when ?? context.currentTime, context.currentTime);

        if (when - this.lastStartTime < o.minInterval) return null;

        const volume: number = o.volume * (options.volume ?? 1) * (1 - Math.random() * clamp(o.volumeVariation, 0, 1));

        if (this.instances.length >= o.maxInstances && !this.makeRoom(o.steal, volume)) return null;

        const semitones: number = o.pitch + (options.pitch ?? 0) + (Math.random() * 2 - 1) * o.pitchVariation;

        const instance: SoundInstance = new SoundInstance(this, target, {
            volume,
            when,
            offset: Math.max(0, options.offset ?? 0),
            playbackRate: Math.pow(2, semitones / 12),
            loop: options.loop ?? o.loop
        });

        this.instances.push(instance);
        this.lastStartTime = when;

        return instance;
    }

    /**
     * Stops all instances of this sound, with a short fade.
     */
    public stopAll(fadeTime: number = STEAL_FADE_TIME): void {
        for (const instance of [...this.instances])
            instance.stop(fadeTime);
    }

    /** Called by an instance once it stops, so it no longer counts towards maxInstances. */
    public remove(instance: SoundInstance): void {

        const idx: number = this.instances.indexOf(instance);

        if (idx !== -1) this.instances.splice(idx, 1);
    }

    private makeRoom(steal: SoundStealMode, volume: number): boolean {

        if (steal === "none" || this.instances.length === 0) return false;

        let victim: SoundInstance = this.instances[0];

        if (steal === "quietest") {

            for (const instance of this.instances)
                if (instance.loudness < victim.loudness) victim = instance;

            // A new instance that is quieter than everything playing is not worth a click.
            if (victim.loudness > volume) return false;
        }

        victim.stop(STEAL_FADE_TIME);
        return true;
    }
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
export class SoundInstance {

    public id: string = v4();

    public readonly sound: Sound;
    public readonly startTime: number;
    public readonly loop: boolean;

    private context: BaseAudioContext;
    private node: AudioBufferSourceNode | null = null;
    /** Node the AudioBufferSourceNode is connected to. */
    private nodeDestination: AudioNode;
    private fader: GainNode;
    private ownsFader: boolean;
    private owner: SpatialAudioSource | null;
    private exclusive: boolean;
    private release: (() => void) | null;

    private currentVolume: number;
    private startOffset: number;
    private playbackRate: number;

    private ended: boolean = false;
    private stopping: boolean = false;
    private suspended: boolean = false;
    private endedCallbacks: (() => void)[] = [];

    constructor(sound: Sound, target: SoundInstanceTarget, playback: SoundInstancePlayback) {

        this.sound = sound;
        this.context = target.context;
        this.owner = target.owner ?? null;
        this.exclusive = !!(target.exclusive && this.owner);
        this.release = target.release ?? null;

        this.currentVolume = playback.volume;
        this.startTime = playback.when;
        this.startOffset = playback.offset;
        this.playbackRate = playback.playbackRate;
        this.loop = playback.loop;

        if (this.exclusive) {
            const owner: SpatialAudioSource = this.owner as SpatialAudioSource;

            owner.setVolume(playback.volume);

            this.fader = owner.input as GainNode;
            this.ownsFader = false;
            this.nodeDestination = target.destination;
        } else {
            this.fader = new GainNode(this.context, { gain: playback.volume });
            this.fader.connect(target.destination);
            this.ownsFader = true;
            this.nodeDestination = this.fader;
        }

        this.owner?.soundInstances.add(this);
        this.spawn(this.startTime, this.startOffset);
    }

    public get isPlaying(): boolean {
        return !this.ended && !this.stopping;
    }

    /** Whether the instance is a loop whose audio node is released because nobody can hear it. */
    public get isSuspended(): boolean {
        return this.suspended;
    }

    public get volume(): number {
        return this.currentVolume;
    }

    /**
     * The spatial source this instance is heard through, for example to let it follow a moving object.
     * Null when the instance is not positioned or has ended.
     */
    public get source(): SpatialAudioSource | null {
        return this.ended ? null : this.owner;
    }

    /** Loudness used to pick an instance to steal: the rendered gain when spatial, the volume otherwise. */
    public get loudness(): number {
        return this.owner ? this.owner.renderedGain * (this.exclusive ? 1 : this.currentVolume) : this.currentVolume;
    }

    /** Position in the buffer at the given context time, as if the instance had never been suspended. */
    private playhead(time: number): number {

        const duration: number = this.sound.buffer.duration;
        const position: number = this.startOffset + Math.max(0, time - this.startTime) * this.playbackRate;

        if (duration <= 0) return 0;

        return this.loop ? position % duration : Math.min(position, duration);
    }

    private spawn(when: number, offset: number): void {

        const self: SoundInstance = this;
        const node: AudioBufferSourceNode = new AudioBufferSourceNode(this.context, {
            buffer: this.sound.buffer,
            loop: this.loop,
            playbackRate: this.playbackRate
        });

        node.connect(this.nodeDestination);
        node.onended = function () {
            if (self.node === node) self.finish();
        };

        node.start(when, offset);
        this.node = node;
    }

    public setVolume(volume: number): SoundInstance {

        if (this.ended || this.stopping) return this;

        this.currentVolume = Math.max(0, volume);

        if (this.exclusive) this.owner?.setVolume(this.currentVolume);
        else this.fader.gain.setTargetAtTime(this.currentVolume, this.context.currentTime, 0.01);

        return this;
    }

    /**
     * Moves the spatial source of this instance. Only for instances started with SpatialAudioRenderer.playAt;
     * an instance started with SpatialAudioSource.play moves with its source.
     */
    public setPosition(x: number, y: number, z?: number): SoundInstance {
        if (!this.ended && this.exclusive) this.owner?.setPosition(x, y, z);
        return this;
    }

    /**
     * Releases the audio node of a looping instance. The loop keeps running "virtually", and continues at
     * the right position on {@link resume}. Does nothing for one-shots, which are short enough to play out.
     */
    public suspend(): void {

        if (!this.loop || this.ended || this.stopping || this.suspended || !this.node) return;
        if (this.context.currentTime < this.startTime) return;

        const node: AudioBufferSourceNode = this.node;

        this.node = null;
        this.suspended = true;

        node.onended = null;

        try {
            node.stop();
        } catch {
            // Already stopped.
        }

        node.disconnect();
    }

    /**
     * Recreates the audio node of a suspended loop, at the position the loop would have been at.
     */
    public resume(): void {

        if (!this.suspended || this.ended || this.stopping) return;

        const now: number = this.context.currentTime;

        this.suspended = false;
        this.spawn(now, this.playhead(now));
    }

    /**
     * Stops the instance after a short fade. A fade time of 0 stops it immediately.
     */
    public stop(fadeTime: number = STEAL_FADE_TIME): void {

        if (this.ended || this.stopping) return;

        this.stopping = true;
        this.sound.remove(this);

        // A suspended loop has no node that could fire onended.
        if (!this.node) return this.finish();

        const now: number = this.context.currentTime;
        const gain: AudioParam = this.fader.gain;

        if (fadeTime > 0) {
            gain.cancelScheduledValues(now);
            gain.setValueAtTime(gain.value, now);
            gain.linearRampToValueAtTime(0, now + fadeTime);
        }

        try {
            this.node.stop(now + Math.max(0, fadeTime));
        } catch {
            // Not started yet or already stopped; onended still fires once it ends.
        }
    }

    public onEnded(callback: () => void): SoundInstance {

        if (this.ended) callback();
        else this.endedCallbacks.push(callback);

        return this;
    }

    /** Releases the audio nodes, once the instance has ended or was stopped while suspended. */
    private finish(): void {

        if (this.ended) return;

        this.ended = true;
        this.suspended = false;
        this.sound.remove(this);

        this.node?.disconnect();
        this.node = null;

        if (this.ownsFader) this.fader.disconnect();

        this.owner?.soundInstances.delete(this);
        this.release?.();

        for (const callback of this.endedCallbacks)
            callback();

        this.endedCallbacks = [];
    }
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}
