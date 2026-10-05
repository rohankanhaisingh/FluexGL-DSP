import { AudioClipPlayer } from "./AudioClipPlayer";
import { AudioClip } from "./AudioClip";
import { Master } from "./Master";
import { Effector } from "./Effector";
import { ArrayPosition } from "../../typings";
export declare class Channel {
    id: string;
    label: string;
    input: AudioNode | null;
    stereoPannerNode: StereoPannerNode | null;
    analyserNode: AnalyserNode | null;
    gainNode: GainNode | null;
    output: AudioNode | null;
    effects: Effector[];
    context: AudioContext | null;
    sends: Channel[];
    /** Master channels this channel is attached to. Maintained by {@link Master.attachChannel} and {@link Master.detachChannel}. */
    masters: Master[];
    audioClipPlayer: AudioClipPlayer | null;
    constructor(context: AudioContext, label?: string);
    private rebuildEffectChainInternal;
    private disconnectAudioNodes;
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
    pan(pan?: number): number;
    getEffectsByLabel(label: string): Effector[];
    getFirstEffectByLabel(label: string): Effector | null;
    getEffectById(id: string): Effector[];
    getFirstEffectById(id: string): Effector | null;
    moveEffectToIndex(effect: Effector, index: number | ArrayPosition): void;
}
//# sourceMappingURL=Channel.d.ts.map