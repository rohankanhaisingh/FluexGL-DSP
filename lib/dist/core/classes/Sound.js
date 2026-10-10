import { v4 } from "uuid";
import { Debug } from "../../utilities/debugger";
import { ErrorCodes } from "../../console-codes";
/** Fade used when an instance is stolen, short enough to be inaudible but long enough to avoid a click. */
const STEAL_FADE_TIME = 0.02;
/** Decoded buffers per context and url, so a file is only fetched and decoded once. */
const bufferCache = new WeakMap();
const DEFAULT_OPTIONS = {
    label: null,
    volume: 1,
    volumeVariation: 0,
    pitch: 0,
    pitchVariation: 0,
    maxInstances: 8,
    steal: "oldest",
    minInterval: 0,
    loop: false
};
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
    id = v4();
    buffer;
    options;
    /** Instances that are playing, in the order they were started. */
    instances = [];
    lastStartTime = -Infinity;
    constructor(source, options) {
        this.buffer = source instanceof AudioBuffer ? source : source.audioBuffer;
        this.options = { ...DEFAULT_OPTIONS, ...options };
    }
    /**
     * Fetches and decodes an audio file with the given AudioContext (or AudioDevice). The decoded
     * buffer is cached per context, so loading the same url again does not fetch or decode it again.
     */
    static async load(target, url, options) {
        const context = target instanceof BaseAudioContext ? target : target.context;
        let cache = bufferCache.get(context);
        if (!cache) {
            cache = new Map();
            bufferCache.set(context, cache);
        }
        let pending = cache.get(url);
        if (!pending) {
            pending = fetch(url).then(function (response) {
                if (!response.ok)
                    throw new Error(`Could not load sound "${url}". Received status code: ${response.status}.`);
                return response.arrayBuffer();
            }).then(function (arrayBuffer) {
                return context.decodeAudioData(arrayBuffer);
            });
            cache.set(url, pending);
            // A failed load should not stay cached, so it can be retried.
            pending.catch(() => cache.delete(url));
        }
        try {
            return new Sound(await pending, { label: url, ...options });
        }
        catch (error) {
            Debug.error("The sound could not be loaded.", [
                `Url: ${url}`,
                `${error}`
            ], ErrorCodes.PATH_TO_FILE_NOT_FOUND);
            throw error;
        }
    }
    get duration() {
        return this.buffer.duration;
    }
    /** Number of instances currently playing. */
    get playing() {
        return this.instances.length;
    }
    /**
     * Plays the sound unpositioned on the given bus channel or master channel, for example UI sounds
     * or the sounds of the player itself. Returns null when the start was skipped (see minInterval, maxInstances).
     *
     * To play a sound from a game object, use SpatialAudioSource.play (an object with its own source)
     * or SpatialAudioRenderer.playAt (fire-and-forget at a position).
     */
    play(target, options) {
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
    createInstance(target) {
        const o = this.options;
        const options = target.options ?? {};
        const context = target.context;
        const when = Math.max(options.when ?? context.currentTime, context.currentTime);
        if (when - this.lastStartTime < o.minInterval)
            return null;
        const volume = o.volume * (options.volume ?? 1) * (1 - Math.random() * clamp(o.volumeVariation, 0, 1));
        if (this.instances.length >= o.maxInstances && !this.makeRoom(o.steal, volume))
            return null;
        const semitones = o.pitch + (options.pitch ?? 0) + (Math.random() * 2 - 1) * o.pitchVariation;
        const instance = new SoundInstance(this, target, {
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
    stopAll(fadeTime = STEAL_FADE_TIME) {
        for (const instance of [...this.instances])
            instance.stop(fadeTime);
    }
    /** Called by an instance once it stops, so it no longer counts towards maxInstances. */
    remove(instance) {
        const idx = this.instances.indexOf(instance);
        if (idx !== -1)
            this.instances.splice(idx, 1);
    }
    makeRoom(steal, volume) {
        if (steal === "none" || this.instances.length === 0)
            return false;
        let victim = this.instances[0];
        if (steal === "quietest") {
            for (const instance of this.instances)
                if (instance.loudness < victim.loudness)
                    victim = instance;
            // A new instance that is quieter than everything playing is not worth a click.
            if (victim.loudness > volume)
                return false;
        }
        victim.stop(STEAL_FADE_TIME);
        return true;
    }
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
    id = v4();
    sound;
    startTime;
    loop;
    context;
    node = null;
    /** Node the AudioBufferSourceNode is connected to. */
    nodeDestination;
    fader;
    ownsFader;
    owner;
    exclusive;
    release;
    currentVolume;
    startOffset;
    playbackRate;
    ended = false;
    stopping = false;
    suspended = false;
    endedCallbacks = [];
    constructor(sound, target, playback) {
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
            const owner = this.owner;
            owner.setVolume(playback.volume);
            this.fader = owner.input;
            this.ownsFader = false;
            this.nodeDestination = target.destination;
        }
        else {
            this.fader = new GainNode(this.context, { gain: playback.volume });
            this.fader.connect(target.destination);
            this.ownsFader = true;
            this.nodeDestination = this.fader;
        }
        this.owner?.soundInstances.add(this);
        this.spawn(this.startTime, this.startOffset);
    }
    get isPlaying() {
        return !this.ended && !this.stopping;
    }
    /** Whether the instance is a loop whose audio node is released because nobody can hear it. */
    get isSuspended() {
        return this.suspended;
    }
    get volume() {
        return this.currentVolume;
    }
    /**
     * The spatial source this instance is heard through, for example to let it follow a moving object.
     * Null when the instance is not positioned or has ended.
     */
    get source() {
        return this.ended ? null : this.owner;
    }
    /** Loudness used to pick an instance to steal: the rendered gain when spatial, the volume otherwise. */
    get loudness() {
        return this.owner ? this.owner.renderedGain * (this.exclusive ? 1 : this.currentVolume) : this.currentVolume;
    }
    /** Position in the buffer at the given context time, as if the instance had never been suspended. */
    playhead(time) {
        const duration = this.sound.buffer.duration;
        const position = this.startOffset + Math.max(0, time - this.startTime) * this.playbackRate;
        if (duration <= 0)
            return 0;
        return this.loop ? position % duration : Math.min(position, duration);
    }
    spawn(when, offset) {
        const self = this;
        const node = new AudioBufferSourceNode(this.context, {
            buffer: this.sound.buffer,
            loop: this.loop,
            playbackRate: this.playbackRate
        });
        node.connect(this.nodeDestination);
        node.onended = function () {
            if (self.node === node)
                self.finish();
        };
        node.start(when, offset);
        this.node = node;
    }
    setVolume(volume) {
        if (this.ended || this.stopping)
            return this;
        this.currentVolume = Math.max(0, volume);
        if (this.exclusive)
            this.owner?.setVolume(this.currentVolume);
        else
            this.fader.gain.setTargetAtTime(this.currentVolume, this.context.currentTime, 0.01);
        return this;
    }
    /**
     * Moves the spatial source of this instance. Only for instances started with SpatialAudioRenderer.playAt;
     * an instance started with SpatialAudioSource.play moves with its source.
     */
    setPosition(x, y, z) {
        if (!this.ended && this.exclusive)
            this.owner?.setPosition(x, y, z);
        return this;
    }
    /**
     * Releases the audio node of a looping instance. The loop keeps running "virtually", and continues at
     * the right position on {@link resume}. Does nothing for one-shots, which are short enough to play out.
     */
    suspend() {
        if (!this.loop || this.ended || this.stopping || this.suspended || !this.node)
            return;
        if (this.context.currentTime < this.startTime)
            return;
        const node = this.node;
        this.node = null;
        this.suspended = true;
        node.onended = null;
        try {
            node.stop();
        }
        catch {
            // Already stopped.
        }
        node.disconnect();
    }
    /**
     * Recreates the audio node of a suspended loop, at the position the loop would have been at.
     */
    resume() {
        if (!this.suspended || this.ended || this.stopping)
            return;
        const now = this.context.currentTime;
        this.suspended = false;
        this.spawn(now, this.playhead(now));
    }
    /**
     * Stops the instance after a short fade. A fade time of 0 stops it immediately.
     */
    stop(fadeTime = STEAL_FADE_TIME) {
        if (this.ended || this.stopping)
            return;
        this.stopping = true;
        this.sound.remove(this);
        // A suspended loop has no node that could fire onended.
        if (!this.node)
            return this.finish();
        const now = this.context.currentTime;
        const gain = this.fader.gain;
        if (fadeTime > 0) {
            gain.cancelScheduledValues(now);
            gain.setValueAtTime(gain.value, now);
            gain.linearRampToValueAtTime(0, now + fadeTime);
        }
        try {
            this.node.stop(now + Math.max(0, fadeTime));
        }
        catch {
            // Not started yet or already stopped; onended still fires once it ends.
        }
    }
    onEnded(callback) {
        if (this.ended)
            callback();
        else
            this.endedCallbacks.push(callback);
        return this;
    }
    /** Releases the audio nodes, once the instance has ended or was stopped while suspended. */
    finish() {
        if (this.ended)
            return;
        this.ended = true;
        this.suspended = false;
        this.sound.remove(this);
        this.node?.disconnect();
        this.node = null;
        if (this.ownsFader)
            this.fader.disconnect();
        this.owner?.soundInstances.delete(this);
        this.release?.();
        for (const callback of this.endedCallbacks)
            callback();
        this.endedCallbacks = [];
    }
}
function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}
