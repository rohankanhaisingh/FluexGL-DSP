import { v4 } from "uuid";

import { AudioClip } from "./AudioClip";
import { AudioClipPlayer } from "./AudioClipPlayer";
import { Debug } from "../../utilities/debugger";
import { ErrorCodes } from "../../console-codes";
import { SpatialAttenuationOptions, SpatialAudioSourceOptions, SpatialSourceState, Vector3 } from "../../typings";

import type { SpatialAudioVoice } from "./SpatialAudioVoice";
import type { SpatialAudioRenderer } from "./SpatialAudioRenderer";

/**
 * A positioned sound emitter in a 2D or 3D scene. The 2D renderer ignores the z coordinate.
 *
 * Audio clips attached to a source are routed through the source's own
 * gain stage (volume and distance attenuation), and from there into a
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

    private pendingAudioClips: AudioClip[] = [];

    constructor(options?: Partial<SpatialAudioSourceOptions>) {

        if (!options) return;

        if (options.label !== undefined) this.label = options.label;
        if (options.position) this.position = { x: options.position.x, y: options.position.y, z: "z" in options.position ? options.position.z : 0 };
        if (options.volume !== undefined) this.volume = Math.max(0, options.volume);
        if (options.clusterable !== undefined) this.clusterable = options.clusterable;
        if (options.reverbSendFactor !== undefined) this.reverbSendFactor = Math.max(0, options.reverbSendFactor);
        if (options.airAbsorption !== undefined) this.airAbsorption = options.airAbsorption;

        if (options.distanceModel !== undefined) this.attenuation.distanceModel = options.distanceModel;
        if (options.refDistance !== undefined) this.attenuation.refDistance = options.refDistance;
        if (options.maxDistance !== undefined) this.attenuation.maxDistance = options.maxDistance;
        if (options.rolloffFactor !== undefined) this.attenuation.rolloffFactor = options.rolloffFactor;
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
        this.audioClipPlayer = new AudioClipPlayer(context);

        (this.audioClipPlayer.outputGainNode as GainNode).connect(this.input);
        this.input.connect(this.output);

        const pending: AudioClip[] = this.pendingAudioClips;
        this.pendingAudioClips = [];

        for (const clip of pending)
            this.audioClipPlayer.attachAudioClip(clip);
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

    public setAttenuation(attenuation: Partial<SpatialAttenuationOptions>): SpatialAudioSource {
        this.attenuation = { ...this.attenuation, ...attenuation };
        return this;
    }

    /**
     * Routes an AudioClip through this source. Can be called before the source is
     * added to a renderer; the clip is then attached once the source is initialized.
     */
    public attachAudioClip(audioClip: AudioClip): SpatialAudioSource {

        if (!this.audioClipPlayer) {
            if (!this.pendingAudioClips.includes(audioClip))
                this.pendingAudioClips.push(audioClip);

            return this;
        }

        this.audioClipPlayer.attachAudioClip(audioClip);
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

    public get audioClips(): AudioClip[] {
        return this.audioClipPlayer ? this.audioClipPlayer.audioClips : this.pendingAudioClips;
    }

    public stopAll(): SpatialAudioSource {
        this.audioClipPlayer?.stopAll();
        return this;
    }

    /**
     * Stops all clips and releases the audio nodes. The renderer should no longer
     * reference this source; use renderer.removeSource() instead of calling this directly.
     */
    public dispose(): void {

        this.audioClipPlayer?.dispose();
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
