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
    /**
     * Detaches the channel from this master channel. Detaching a channel that is not attached
     * only logs a warning, so it is safe to call at any time.
     *
     * @returns `true` when the channel has been detached, `false` when it was not attached.
     */
    detachChannel(channel: Channel): boolean;
    /**
     * Detaches all channels from this master channel.
     */
    detachAllChannels(): void;
    hasChannel(channel: Channel): boolean;
    hasAudioClipPlayer(): boolean;
    attachAudioClip(audioClip: AudioClip): void;
}
//# sourceMappingURL=Master.d.ts.map