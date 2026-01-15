import { AudioClip } from "./AudioClip";
import { Channel } from "./Channel";
import { Master } from "./Master";
export declare class AudioClipPlayer {
    label: string;
    id: string;
    audioClips: AudioClip[];
    outputGainNode: GainNode | null;
    context: AudioContext | null;
    channel: Channel | Master | null;
    constructor(context: AudioContext);
    AttachAudioClip(audioClip: AudioClip): void;
    DetachAudioClip(clip: AudioClip): void;
    Send(channel: Channel | Master): void;
    Unsend(): void;
    SetVolume(value: number): void;
    StopAll(): void;
    Dispose(): void;
    SetLabel(label: string): void;
    get length(): number;
    get volume(): number;
}
//# sourceMappingURL=AudioClipPlayer.d.ts.map