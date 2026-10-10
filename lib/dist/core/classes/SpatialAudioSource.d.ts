import { AudioClip } from "./AudioClip";
import { AudioClipPlayer } from "./AudioClipPlayer";
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
export declare class SpatialAudioSource {
    id: string;
    label: string | null;
    position: Vector3;
    volume: number;
    clusterable: boolean;
    reverbSendFactor: number;
    airAbsorption: boolean;
    /**
     * Bus the dry sound of this source ends up on, for example an "Entities" or "Ambience" channel.
     * Null uses the output of the renderer. Picked up by the renderer on its next update.
     */
    bus: Channel | Master | null;
    /** Attenuation settings of this source. Missing values fall back to the renderer's settings. */
    attenuation: Partial<SpatialAttenuationOptions>;
    context: AudioContext | null;
    renderer: SpatialAudioRenderer | null;
    audioClipPlayer: AudioClipPlayer | null;
    /** Receives the audio of all attached clips. */
    input: GainNode | null;
    /** Applies volume and distance attenuation. Connected to a voice by the renderer. */
    output: GainNode | null;
    /** The voice this source is currently rendered by. Managed by the renderer. */
    voice: SpatialAudioVoice | null;
    /** Result of the last renderer update. Null when the source has not been rendered yet. */
    state: SpatialSourceState | null;
    /** Whether the source is currently loud enough to be rendered. Managed by the renderer. */
    audible: boolean;
    /** The gain (volume x attenuation) last sent to the audio thread. Managed by the renderer. */
    renderedGain: number;
    /** Sound instances playing through this source. Maintained by SoundInstance. */
    soundInstances: Set<SoundInstance>;
    /** Context time since which this source has had no voice, or null. Managed by the renderer for loop virtualization. */
    virtualSince: number | null;
    private pendingAudioClips;
    /** Channels routed through this source. Connected once the source is initialized. */
    private attachedChannels;
    constructor(options?: Partial<SpatialAudioSourceOptions>);
    private applyOptions;
    /**
     * Restores the default settings and applies the given options, keeping the audio nodes.
     * Used by the renderer to reuse pooled sources for one-shot sounds (see SpatialAudioRenderer.playAt).
     */
    reset(options?: Partial<SpatialAudioSourceOptions>): SpatialAudioSource;
    /** The clip player is only created once a clip is attached, so plain sources stay at two nodes. */
    private ensureAudioClipPlayer;
    /**
     * Creates the audio nodes of this source. Called by the renderer when the source is added.
     */
    initialize(renderer: SpatialAudioRenderer, context: AudioContext): void;
    private connectChannel;
    /**
     * Whether the source is audible, but not rendered because the voice budget of the
     * renderer (maxVoices) is used by louder sources.
     */
    get isVirtual(): boolean;
    get isInitialized(): boolean;
    setPosition(x: number, y: number, z?: number): SpatialAudioSource;
    translate(dx: number, dy: number, dz?: number): SpatialAudioSource;
    setVolume(volume: number): SpatialAudioSource;
    /**
     * Routes this source to the given bus channel or master channel. Null uses the output of the renderer.
     */
    setBus(bus: Channel | Master | null): SpatialAudioSource;
    setAttenuation(attenuation: Partial<SpatialAttenuationOptions>): SpatialAudioSource;
    /**
     * Routes an AudioClip through this source. Can be called before the source is
     * added to a renderer; the clip is then attached once the source is initialized.
     */
    attachAudioClip(audioClip: AudioClip): SpatialAudioSource;
    detachAudioClip(audioClip: AudioClip): SpatialAudioSource;
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
    attachChannel(channel: Channel): SpatialAudioSource;
    detachChannel(channel: Channel): SpatialAudioSource;
    get channels(): Channel[];
    get audioClips(): AudioClip[];
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
    play(sound: Sound, options?: Partial<SoundPlayOptions>): SoundInstance | null;
    stopAll(): SpatialAudioSource;
    /**
     * Stops all clips and releases the audio nodes. The renderer should no longer
     * reference this source; use renderer.removeSource() instead of calling this directly.
     */
    dispose(): void;
}
//# sourceMappingURL=SpatialAudioSource.d.ts.map