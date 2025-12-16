import { Channel } from "./Channel";
export declare class Master {
    id: string;
    channels: Channel[];
    gainNode: GainNode | null;
    analyserNode: AnalyserNode | null;
    context: AudioContext | null;
    constructor(context: AudioContext);
    AttachChannel(channel: Channel): void;
    DetachChannel(channel: Channel): void;
}
//# sourceMappingURL=Master.d.ts.map