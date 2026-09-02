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
    unsend(channel: Channel | Master): void;
    hasAudioClipPlayer(): boolean;
    unsendToAllChannels(): void;
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