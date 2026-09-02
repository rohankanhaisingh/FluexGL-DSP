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
    attachEffect(effect: Effector): void;
    detachEffect(effect: Effector): void;
    attachChannel(channel: Channel): void;
    detachChannel(channel: Channel): void;
    hasAudioClipPlayer(): boolean;
    attachAudioClip(audioClip: AudioClip): void;
}
//# sourceMappingURL=Master.d.ts.map