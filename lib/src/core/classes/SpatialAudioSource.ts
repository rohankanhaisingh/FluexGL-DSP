import { v4 } from "uuid";

import { AudioClip } from "./AudioClip";
import { AudioClipPlayer } from "./AudioClipPlayer";
import { Debug } from "../../utilities/debugger";
import { ErrorCodes, WarningCodes } from "../../console-codes";
import { SoundPlayOptions, SpatialAttenuationOptions, SpatialAudioSourceOptions, SpatialSourceState, Vector3 } from "../../typings";

import type { SpatialAudioVoice } from "./SpatialAudioVoice";
import type { SpatialAudioRenderer } from "./SpatialAudioRenderer";
import type { Channel } from "./Channel";
import type { Master } from "./Master";
import type { Sound, SoundInstance } from "./Sound";

/**
 * A positioned sound emitter in a 2D or 3D scene. The 2D renderer ignores the z coordinate.
 *
 * Audio clips and channels (for example an InputChannel with a voice) attached
 * to a source are routed through the source's own gain stage (volume and distance attenuation), and from there into a
 * voice of the renderer. Depending on the distance to the listener the
 * source either has its own voice, or shares one with nearby sources.
 */
export class SpatialAudioSource {

    public id: string = v4();
    public label: string | null = null;

    public position: Vector3 = { x: 0, y: 0, z: 0 };
    public volume: number = 1;
    public clusterable: boolean = true;
    public reverbSendFactor: number = 1;
    public airAbsorption: boolean = true;

    /**
     * Bus the dry sound of this source ends up on, for example an "Entities" or "Ambience" channel.
     * Null uses the output of the renderer. Picked up by the renderer on its next update.
     */
    public bus: Channel | Master | null = null;

    /** Attenuation settings of this source. Missing values fall back to the renderer's settings. */
    public attenuation: Partial<SpatialAttenuationOptions> = {};

    public context: AudioContext | null = null;
    public renderer: SpatialAudioRenderer | null = null;
    public audioClipPlayer: AudioClipPlayer | null = null;

    /** Receives the audio of all attached clips. */
    public input: GainNode | null = null;
    /** Applies volume and distance attenuation. Connected to a voice by the renderer. */
    public output: GainNode | null = null;

    /** The voice this source is currently rendered by. Managed by the renderer. */
    public voice: SpatialAudioVoice | null = null;

    /** Result of the last renderer update. Null when the source has not been rendered yet. */
    public state: SpatialSourceState | null = null;

    /** Whether the source is currently loud enough to be rendered. Managed by the renderer. */
    public audible: boolean = false;

    /** The gain (volume x attenuation) last sent to the audio thread. Managed by the renderer. */
    public renderedGain: number = 0;

    /** Sound instances playing through this source. Maintained by SoundInstance. */
    public soundInstances: Set<SoundInstance> = new Set();

    /** Context time since which this source has had no voice, or null. Managed by the renderer for loop virtualization. */
    public virtualSince: number | null = null;

    private pendingAudioClips: AudioClip[] = [];

    /** Channels routed through this source. Connected once the source is initialized. */
    private attachedChannels: Channel[] = [];

    constructor(options?: Partial<SpatialAudioSourceOptions>) {
        if (options) this.applyOptions(options);
    }

    private applyOptions(options: Partial<SpatialAudioSourceOptions>): void {

        if (options.label !== undefined) this.label = options.label;
        if (options.position) this.position = { x: options.position.x, y: options.position.y, z: "z" in options.position ? options.position.z : 0 };
        if (options.volume !== undefined) this.volume = Math.max(0, options.volume);
        if (options.clusterable !== undefined) this.clusterable = options.clusterable;
        if (options.reverbSendFactor !== undefined) this.reverbSendFactor = Math.max(0, options.reverbSendFactor);
        if (options.airAbsorption !== undefined) this.airAbsorption = options.airAbsorption;
        if (options.bus !== undefined) this.bus = options.bus;

        if (options.distanceModel !== undefined) this.attenuation.distanceModel = options.distanceModel;
        if (options.refDistance !== undefined) this.attenuation.refDistance = options.refDistance;
        if (options.maxDistance !== undefined) this.attenuation.maxDistance = options.maxDistance;
        if (options.rolloffFactor !== undefined) this.attenuation.rolloffFactor = options.rolloffFactor;
    }

    /**
     * Restores the default settings and applies the given options, keeping the audio nodes.
     * Used by the renderer to reuse pooled sources for one-shot sounds (see SpatialAudioRenderer.playAt).
     */
    public reset(options?: Partial<SpatialAudioSourceOptions>): SpatialAudioSource {

        this.label = null;
        this.position = { x: 0, y: 0, z: 0 };
        this.volume = 1;
        this.clusterable = true;
        this.reverbSendFactor = 1;
        this.airAbsorption = true;
        this.bus = null;
        this.attenuation = {};
        this.state = null;
        this.audible = false;
        this.renderedGain = 0;
        this.virtualSince = null;

        if (this.input && this.context) {
            this.input.gain.cancelScheduledValues(0);
            this.input.gain.setValueAtTime(1, this.context.currentTime);
        }

        if (options) this.applyOptions(options);
        return this;
    }

    /** The clip player is only created once a clip is attached, so plain sources stay at two nodes. */
    private ensureAudioClipPlayer(): AudioClipPlayer | null {

        if (!this.audioClipPlayer && this.context && this.input) {
            this.audioClipPlayer = new AudioClipPlayer(this.context);
            (this.audioClipPlayer.outputGainNode as GainNode).connect(this.input);
        }

        return this.audioClipPlayer;
    }

    /**
     * Creates the audio nodes of this source. Called by the renderer when the source is added.
     */
    public initialize(renderer: SpatialAudioRenderer, context: AudioContext): void {

        if (this.context && this.context !== context) return Debug.error("Could not initialize SpatialAudioSource, because it is already initialized with a different AudioContext.", [
            `SpatialAudioSource id: ${this.id}`
        ], ErrorCodes.CHANNEL_NOT_SAME_AUDIO_CONTEXT);

        this.renderer = renderer;

        if (this.context) return;

        this.context = context;
        this.input = new GainNode(context);
        this.output = new GainNode(context, { gain: 0 });

        this.input.connect(this.output);

        const pending: AudioClip[] = this.pendingAudioClips;
        this.pendingAudioClips = [];

        for (const clip of pending)
            this.ensureAudioClipPlayer()?.attachAudioClip(clip);

        for (const channel of this.attachedChannels)
            this.connectChannel(channel);
    }

    private connectChannel(channel: Channel): void {

        if (!this.input || !channel.output) return;

        if (channel.context !== this.context) return Debug.error("Could not route the channel through this SpatialAudioSource, because they do not share the same AudioContext.", [
            `SpatialAudioSource id: ${this.id}`,
            `Channel id: ${channel.id}`
        ], ErrorCodes.CHANNEL_NOT_SAME_AUDIO_CONTEXT);

        channel.output.connect(this.input);
    }

    /**
     * Whether the source is audible, but not rendered because the voice budget of the
     * renderer (maxVoices) is used by louder sources.
     */
    public get isVirtual(): boolean {
        return this.audible && !this.voice;
    }

    public get isInitialized(): boolean {
        return !!(this.context && this.input && this.output);
    }

    public setPosition(x: number, y: number, z: number = this.position.z): SpatialAudioSource {
        this.position.x = x;
        this.position.y = y;
        this.position.z = z;
        return this;
    }

    public translate(dx: number, dy: number, dz: number = 0): SpatialAudioSource {
        this.position.x += dx;
        this.position.y += dy;
        this.position.z += dz;
        return this;
    }

    public setVolume(volume: number): SpatialAudioSource {
        this.volume = Math.max(0, volume);
        return this;
    }

    /**
     * Routes this source to the given bus channel or master channel. Null uses the output of the renderer.
     */
    public setBus(bus: Channel | Master | null): SpatialAudioSource {
        this.bus = bus;
        return this;
    }

    public setAttenuation(attenuation: Partial<SpatialAttenuationOptions>): SpatialAudioSource {
        this.attenuation = { ...this.attenuation, ...attenuation };
        return this;
    }

    /**
     * Routes an AudioClip through this source. Can be called before the source is
     * added to a renderer; the clip is then attached once the source is initialized.
     */
    public attachAudioClip(audioClip: AudioClip): SpatialAudioSource {

        const player: AudioClipPlayer | null = this.ensureAudioClipPlayer();

        if (!player) {
            if (!this.pendingAudioClips.includes(audioClip))
                this.pendingAudioClips.push(audioClip);

            return this;
        }

        player.attachAudioClip(audioClip);
        return this;
    }

    public detachAudioClip(audioClip: AudioClip): SpatialAudioSource {

        const idx: number = this.pendingAudioClips.indexOf(audioClip);

        if (idx !== -1) {
            this.pendingAudioClips.splice(idx, 1);
            return this;
        }

        this.audioClipPlayer?.detachAudioClip(audioClip);
        return this;
    }

    /**
     * Routes the output of a channel through this source, so it is positioned in the scene.
     * Works with any channel, such as an InputChannel carrying a microphone or the voice of
     * another player (see {@link InputChannel.setMediaStream}). Effects on the channel are applied
     * before the spatialization. Can be called before the source is added to a renderer.
     *
     * The channel should not be sent to a master channel as well, otherwise it is also heard unpositioned.
     *
     * @example
     * ```
     * const voice = audioDevice.createChannel("Player 2");
     * voice.attachEffect(new HighPassFilter({ cutoff: 300 }));
     *
     * renderer.createSource({ position: { x: 10, y: 0, z: -5 } }).attachChannel(voice);
     * ```
     */
    public attachChannel(channel: Channel): SpatialAudioSource {

        if (this.attachedChannels.includes(channel)) return this;

        if (channel.masters.length > 0) Debug.warn("The channel attached to this SpatialAudioSource is also sent to a master channel, so it is heard unpositioned as well.", [
            "Call channel.unsendFromAllMasters() if only the positioned sound should be heard.",
            `Channel id: ${channel.id}`
        ], WarningCodes.CHANNEL_ALSO_SENT_TO_MASTER);

        this.attachedChannels.push(channel);
        this.connectChannel(channel);
        return this;
    }

    public detachChannel(channel: Channel): SpatialAudioSource {

        const idx: number = this.attachedChannels.indexOf(channel);

        if (idx === -1) return this;

        this.attachedChannels.splice(idx, 1);

        if (channel.output && this.input) {
            try {
                channel.output.disconnect(this.input);
            } catch {
                // Not connected (yet), which is the desired end state anyway.
            }
        }

        return this;
    }

    public get channels(): Channel[] {
        return [...this.attachedChannels];
    }

    public get audioClips(): AudioClip[] {
        return this.audioClipPlayer ? this.audioClipPlayer.audioClips : this.pendingAudioClips;
    }

    /**
     * Plays a sound through this source, so it is positioned at (and moves with) this source. Every
     * instance gets its own volume; the source volume applies on top. Looping instances are
     * suspended automatically while the source has no voice. The source must be added to a renderer first.
     * Returns null when the start was skipped (see SoundOptions.minInterval and maxInstances).
     *
     * @example
     * ```
     * const npc = renderer.createSource({ position: npc.position, bus: entitiesBus });
     * npc.play(footstep, { volume: 0.6 });
     * const engine = npc.play(engineLoop, { loop: true });
     * ```
     */
    public play(sound: Sound, options?: Partial<SoundPlayOptions>): SoundInstance | null {

        if (!this.context || !this.input) {
            Debug.error("Could not play sound, because the SpatialAudioSource is not initialized.", [
                "Add the source to a renderer (renderer.addSource or renderer.createSource) before playing sounds on it.",
                `SpatialAudioSource id: ${this.id}`
            ], ErrorCodes.CHANNEL_NOT_INITIALIZED);
            return null;
        }

        return sound.createInstance({ context: this.context, destination: this.input, options, owner: this });
    }

    public stopAll(): SpatialAudioSource {

        this.audioClipPlayer?.stopAll();

        for (const instance of Array.from(this.soundInstances))
            instance.stop();

        return this;
    }

    /**
     * Stops all clips and releases the audio nodes. The renderer should no longer
     * reference this source; use renderer.removeSource() instead of calling this directly.
     */
    public dispose(): void {

        for (const instance of Array.from(this.soundInstances))
            instance.stop(0);

        this.audioClipPlayer?.dispose();

        for (const channel of [...this.attachedChannels])
            this.detachChannel(channel);

        this.input?.disconnect();
        this.output?.disconnect();

        this.audioClipPlayer = null;
        this.input = null;
        this.output = null;
        this.context = null;
        this.renderer = null;
        this.voice = null;
        this.state = null;
        this.audible = false;
    }
}
