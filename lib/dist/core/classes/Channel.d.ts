import { AudioClipPlayer } from "./AudioClipPlayer";
import { AudioClip } from "./AudioClip";
import { Master } from "./Master";
import { Effector } from "./Effector";
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
    constructor(context: AudioContext);
    private rebuildEffectChain;
    AddEffect(effect: Effector): void;
    AttachEffect(effect: Effector): void;
    RemoveEffect(effect: Effector): void;
    DetachEffect(effect: Effector): void;
    private disconnectAudioNodes;
    private isInitialized;
    private isReachable;
    Send(channel: Channel | Master): void;
    Unsend(channel: Channel | Master): void;
    HasAudioClipPlayer(): boolean;
    UnsendToAllChannels(): void;
    AttachAudioClip(audioClip: AudioClip): void;
}
//# sourceMappingURL=Channel.d.ts.map