import { AudioClipPlayer } from "./AudioClipPlayer";
import { AudioClip } from "./AudioClip";
export declare class Channel {
    id: string;
    label: string;
    sends: Channel[];
    audioClipPlayer: AudioClipPlayer | null;
    input: AudioNode | null;
    stereoPannerNode: StereoPannerNode | null;
    analyserNode: AnalyserNode | null;
    gainNode: GainNode | null;
    output: AudioNode | null;
    context: AudioContext | null;
    constructor(context: AudioContext);
    private disconnectAudioNodes;
    private isInitialized;
    private isReachable;
    Send(channel: Channel): void;
    Unsend(channel: Channel): void;
    UnsendToAllChannels(): void;
    LinkAudioClip(audioClip: AudioClip): void;
}
//# sourceMappingURL=Channel.d.ts.map