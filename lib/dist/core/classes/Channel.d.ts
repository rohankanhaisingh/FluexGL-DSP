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
    private rebuildEffectChain;
    private disconnectAudioNodes;
    private isInitialized;
    private isReachable;
    /**
     * Public method to manually rebuild the effect chain.
     * Can be useful when the automatic rebuilt did not
     * work properly.
     * @returns
     */
    RebuildEffectChain(): void;
    AddEffect(effect: Effector): Channel;
    AttachEffect(effect: Effector): Channel;
    RemoveEffect(effect: Effector): void;
    RemoveAllEffects(): void;
    DetachEffect(effect: Effector): void;
    DetachAllEffects(): void;
    Send(channel: Channel | Master): void;
    Unsend(channel: Channel | Master): void;
    HasAudioClipPlayer(): boolean;
    UnsendToAllChannels(): void;
    AttachAudioClip(audioClip: AudioClip): Channel;
    Volume(volume?: number): number;
    Pan(pan?: number): number;
    GetEffectsByLabel(label: string): Effector[];
    GetFirstEffectByLabel(label: string): Effector | null;
    GetEffectById(id: string): Effector[];
    GetFirstEffectById(id: string): Effector | null;
    MoveEffectToIndex(effect: Effector, index: number | ArrayPosition): void;
}
//# sourceMappingURL=Channel.d.ts.map