import { Channel } from "./Channel";
import { Effector } from "./Effector";
export declare class Master {
    id: string;
    channels: Channel[];
    effects: Effector[];
    inputNode: GainNode | null;
    gainNode: GainNode | null;
    analyserNode: AnalyserNode | null;
    context: AudioContext | null;
    constructor(context: AudioContext);
    private disconnectAudioNodes;
    private rebuildEffectChain;
    AttachEffect(effect: Effector): void;
    DetachEffect(effect: Effector): void;
    AttachChannel(channel: Channel): void;
    DetachChannel(channel: Channel): void;
}
//# sourceMappingURL=Master.d.ts.map