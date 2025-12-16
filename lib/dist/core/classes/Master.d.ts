import { Channel } from "./Channel";
import { Effector } from "./Effector";
import { AudioClipPlayer } from "./AudioClipPlayer";
import { AudioClip } from "./AudioClip";
export declare class Master {
    id: string;
    channels: Channel[];
    effects: Effector[];
    input: GainNode | null;
    gainNode: GainNode | null;
    analyserNode: AnalyserNode | null;
    context: AudioContext | null;
    audioClipPlayer: AudioClipPlayer | null;
    constructor(context: AudioContext);
    private disconnectAudioNodes;
    private rebuildEffectChain;
    AttachEffect(effect: Effector): void;
    DetachEffect(effect: Effector): void;
    AttachChannel(channel: Channel): void;
    DetachChannel(channel: Channel): void;
    HasAudioClipPlayer(): boolean;
    AttachAudioClip(audioClip: AudioClip): void;
}
//# sourceMappingURL=Master.d.ts.map