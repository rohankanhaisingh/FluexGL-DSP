import { Channel } from "./Channel";
export declare class Master {
    id: string;
    channels: Channel[];
    context: AudioContext;
    gainNode: GainNode;
    analyserNode: AnalyserNode;
    constructor();
    AttachChannel(channel: Channel): void;
    DetachChannel(channel: Channel): void;
}
//# sourceMappingURL=Master.d.ts.map