import { Master } from "./Master";
export declare class Channel {
    id: string;
    label: string;
    linkedChannels: Channel[];
    input: AudioNode | null;
    stereoPannerNode: StereoPannerNode | null;
    analyserNode: AnalyserNode | null;
    gainNode: GainNode | null;
    output: AudioNode | null;
    context: AudioContext | null;
    master: Master | null;
    constructor(master?: Master);
    Initialize(source: Master | Channel): void;
    private disconnectAudioNodes;
    private isInitialized;
    private isReachable;
    Link(channel: Channel): void;
    Unlink(channel: Channel): void;
    UnlinkFromAllChannels(): void;
}
//# sourceMappingURL=Channel.d.ts.map