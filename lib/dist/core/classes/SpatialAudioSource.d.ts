import { AudioClip } from "./AudioClip";
import { AudioClipPlayer } from "./AudioClipPlayer";
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
export declare class SpatialAudioSource {
    id: string;
    label: string | null;
    position: Vector3;
    volume: number;
    clusterable: boolean;
    reverbSendFactor: number;
    airAbsorption: boolean;
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
    private pendingAudioClips;
    constructor(options?: Partial<SpatialAudioSourceOptions>);
    /**
     * Creates the audio nodes of this source. Called by the renderer when the source is added.
     */
    initialize(renderer: SpatialAudioRenderer, context: AudioContext): void;
    /**
     * Whether the source is audible, but not rendered because the voice budget of the
     * renderer (maxVoices) is used by louder sources.
     */
    get isVirtual(): boolean;
    get isInitialized(): boolean;
    setPosition(x: number, y: number, z?: number): SpatialAudioSource;
    translate(dx: number, dy: number, dz?: number): SpatialAudioSource;
    setVolume(volume: number): SpatialAudioSource;
    setAttenuation(attenuation: Partial<SpatialAttenuationOptions>): SpatialAudioSource;
    /**
     * Routes an AudioClip through this source. Can be called before the source is
     * added to a renderer; the clip is then attached once the source is initialized.
     */
    attachAudioClip(audioClip: AudioClip): SpatialAudioSource;
    detachAudioClip(audioClip: AudioClip): SpatialAudioSource;
    get audioClips(): AudioClip[];
    stopAll(): SpatialAudioSource;
    /**
     * Stops all clips and releases the audio nodes. The renderer should no longer
     * reference this source; use renderer.removeSource() instead of calling this directly.
     */
    dispose(): void;
}
//# sourceMappingURL=SpatialAudioSource.d.ts.map