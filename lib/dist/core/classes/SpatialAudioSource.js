import { v4 } from "uuid";
import { AudioClipPlayer } from "./AudioClipPlayer";
import { Debug } from "../../utilities/debugger";
import { ErrorCodes } from "../../console-codes";
/**
 * A positioned sound emitter in a 2D or 3D scene. The 2D renderer ignores the z coordinate.
 *
 * Audio clips attached to a source are routed through the source's own
 * gain stage (volume and distance attenuation), and from there into a
 * voice of the renderer. Depending on the distance to the listener the
 * source either has its own voice, or shares one with nearby sources.
 */
export class SpatialAudioSource {
    id = v4();
    label = null;
    position = { x: 0, y: 0, z: 0 };
    volume = 1;
    clusterable = true;
    reverbSendFactor = 1;
    airAbsorption = true;
    /** Attenuation settings of this source. Missing values fall back to the renderer's settings. */
    attenuation = {};
    context = null;
    renderer = null;
    audioClipPlayer = null;
    /** Receives the audio of all attached clips. */
    input = null;
    /** Applies volume and distance attenuation. Connected to a voice by the renderer. */
    output = null;
    /** The voice this source is currently rendered by. Managed by the renderer. */
    voice = null;
    /** Result of the last renderer update. Null when the source has not been rendered yet. */
    state = null;
    /** Whether the source is currently loud enough to be rendered. Managed by the renderer. */
    audible = false;
    /** The gain (volume x attenuation) last sent to the audio thread. Managed by the renderer. */
    renderedGain = 0;
    pendingAudioClips = [];
    constructor(options) {
        if (!options)
            return;
        if (options.label !== undefined)
            this.label = options.label;
        if (options.position)
            this.position = { x: options.position.x, y: options.position.y, z: "z" in options.position ? options.position.z : 0 };
        if (options.volume !== undefined)
            this.volume = Math.max(0, options.volume);
        if (options.clusterable !== undefined)
            this.clusterable = options.clusterable;
        if (options.reverbSendFactor !== undefined)
            this.reverbSendFactor = Math.max(0, options.reverbSendFactor);
        if (options.airAbsorption !== undefined)
            this.airAbsorption = options.airAbsorption;
        if (options.distanceModel !== undefined)
            this.attenuation.distanceModel = options.distanceModel;
        if (options.refDistance !== undefined)
            this.attenuation.refDistance = options.refDistance;
        if (options.maxDistance !== undefined)
            this.attenuation.maxDistance = options.maxDistance;
        if (options.rolloffFactor !== undefined)
            this.attenuation.rolloffFactor = options.rolloffFactor;
    }
    /**
     * Creates the audio nodes of this source. Called by the renderer when the source is added.
     */
    initialize(renderer, context) {
        if (this.context && this.context !== context)
            return Debug.error("Could not initialize SpatialAudioSource, because it is already initialized with a different AudioContext.", [
                `SpatialAudioSource id: ${this.id}`
            ], ErrorCodes.CHANNEL_NOT_SAME_AUDIO_CONTEXT);
        this.renderer = renderer;
        if (this.context)
            return;
        this.context = context;
        this.input = new GainNode(context);
        this.output = new GainNode(context, { gain: 0 });
        this.audioClipPlayer = new AudioClipPlayer(context);
        this.audioClipPlayer.outputGainNode.connect(this.input);
        this.input.connect(this.output);
        const pending = this.pendingAudioClips;
        this.pendingAudioClips = [];
        for (const clip of pending)
            this.audioClipPlayer.attachAudioClip(clip);
    }
    /**
     * Whether the source is audible, but not rendered because the voice budget of the
     * renderer (maxVoices) is used by louder sources.
     */
    get isVirtual() {
        return this.audible && !this.voice;
    }
    get isInitialized() {
        return !!(this.context && this.input && this.output);
    }
    setPosition(x, y, z = this.position.z) {
        this.position.x = x;
        this.position.y = y;
        this.position.z = z;
        return this;
    }
    translate(dx, dy, dz = 0) {
        this.position.x += dx;
        this.position.y += dy;
        this.position.z += dz;
        return this;
    }
    setVolume(volume) {
        this.volume = Math.max(0, volume);
        return this;
    }
    setAttenuation(attenuation) {
        this.attenuation = { ...this.attenuation, ...attenuation };
        return this;
    }
    /**
     * Routes an AudioClip through this source. Can be called before the source is
     * added to a renderer; the clip is then attached once the source is initialized.
     */
    attachAudioClip(audioClip) {
        if (!this.audioClipPlayer) {
            if (!this.pendingAudioClips.includes(audioClip))
                this.pendingAudioClips.push(audioClip);
            return this;
        }
        this.audioClipPlayer.attachAudioClip(audioClip);
        return this;
    }
    detachAudioClip(audioClip) {
        const idx = this.pendingAudioClips.indexOf(audioClip);
        if (idx !== -1) {
            this.pendingAudioClips.splice(idx, 1);
            return this;
        }
        this.audioClipPlayer?.detachAudioClip(audioClip);
        return this;
    }
    get audioClips() {
        return this.audioClipPlayer ? this.audioClipPlayer.audioClips : this.pendingAudioClips;
    }
    stopAll() {
        this.audioClipPlayer?.stopAll();
        return this;
    }
    /**
     * Stops all clips and releases the audio nodes. The renderer should no longer
     * reference this source; use renderer.removeSource() instead of calling this directly.
     */
    dispose() {
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
