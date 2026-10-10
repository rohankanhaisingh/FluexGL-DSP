import { AudioClipPlayer } from "./AudioClipPlayer";
import { AudioClip } from "./AudioClip";
import { Master } from "./Master";
import { Effector } from "./Effector";
import { ArrayPosition } from "../../typings";
/**
 * A mixer channel (bus): input -> effects -> [panner] -> [analyser] -> gain (output).
 *
 * A channel is kept as light as possible, because a game can have many of them. The
 * StereoPannerNode is only created once the channel is panned away from the centre, the
 * AnalyserNode only by {@link enableAnalyser}, and the AudioClipPlayer only once a clip is
 * attached. `output` is the same node as `gainNode`.
 *
 * Per game object, prefer a SpatialAudioSource (two GainNodes) over a channel, and use
 * channels as buses (for example "Effects", "Entities", "UI", "Ambience" and "Voice chat").
 */
export declare class Channel {
    id: string;
    label: string;
    input: AudioNode | null;
    /** Created on demand by {@link pan}. */
    stereoPannerNode: StereoPannerNode | null;
    /** Created on demand by {@link enableAnalyser}. */
    analyserNode: AnalyserNode | null;
    gainNode: GainNode | null;
    output: AudioNode | null;
    effects: Effector[];
    context: AudioContext | null;
    sends: Channel[];
    /** Master channels this channel is attached to. Maintained by {@link Master.attachChannel} and {@link Master.detachChannel}. */
    masters: Master[];
    private clipPlayer;
    constructor(context: AudioContext, label?: string);
    /**
     * The player for audio clips attached directly to this channel. Created on first access,
     * so channels that never play clips themselves do not carry an extra node.
     */
    get audioClipPlayer(): AudioClipPlayer | null;
    private rebuildEffectChainInternal;
    private disconnectAudioNodes;
    /**
     * Inserts an AnalyserNode after the effects (and panner) of this channel, and returns it.
     * Channels have no analyser by default, because it costs processing time on every channel.
     */
    enableAnalyser(options?: AnalyserOptions): AnalyserNode;
    /**
     * Removes the AnalyserNode created by {@link enableAnalyser}.
     */
    disableAnalyser(): void;
    /**
     * Stops the clips of this channel, removes all of its outgoing links and releases its audio nodes.
     * Channels sending to this channel should call `.unsend(channel)` themselves; until then their
     * signal simply ends here.
     */
    dispose(): void;
    private isInitialized;
    private isReachable;
    /**
     * Public method to manually rebuild the effect chain.
     * Can be useful when the automatic rebuilt did not
     * work properly.
     * @returns
     */
    rebuildEffectChain(): void;
    addEffect(effect: Effector): Channel;
    attachEffect(effect: Effector): Channel;
    removeEffect(effect: Effector): void;
    removeAllEffects(): void;
    detachEffect(effect: Effector): void;
    detachAllEffects(): void;
    send(channel: Channel | Master): void;
    /**
     * Stops sending the signal of this channel to the given channel or master channel.
     * Unsending from a target this channel is not sent to does nothing, so it is safe to call at any time.
     *
     * @returns `true` when the link has been removed, `false` when there was no link.
     */
    unsend(channel: Channel | Master): boolean;
    /**
     * Whether the signal of this channel is sent to the given channel or master channel.
     */
    isSentTo(channel: Channel | Master): boolean;
    /**
     * Whether audio clips can be attached to this channel. The player itself is created on demand.
     */
    hasAudioClipPlayer(): boolean;
    unsendToAllChannels(): void;
    /**
     * Detaches this channel from every master channel it is attached to.
     */
    unsendFromAllMasters(): void;
    /**
     * Removes every outgoing link of this channel, both to channels and to master channels.
     */
    unsendFromAll(): void;
    attachAudioClip(audioClip: AudioClip): Channel;
    volume(volume?: number): number;
    /**
     * Sets or returns the stereo pan of this channel. The StereoPannerNode is only created
     * once the channel is panned away from the centre.
     */
    pan(pan?: number): number;
    getEffectsByLabel(label: string): Effector[];
    getFirstEffectByLabel(label: string): Effector | null;
    getEffectById(id: string): Effector[];
    getFirstEffectById(id: string): Effector | null;
    moveEffectToIndex(effect: Effector, index: number | ArrayPosition): void;
}
//# sourceMappingURL=Channel.d.ts.map