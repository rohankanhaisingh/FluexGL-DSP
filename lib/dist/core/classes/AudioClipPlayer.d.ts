import { AudioClip } from "./AudioClip";
import { Channel } from "./Channel";
export declare class AudioClipPlayer {
    label: string;
    id: string;
    audioClips: AudioClip[];
    outputGainNode: GainNode | null;
    context: AudioContext | null;
    channel: Channel | null;
    constructor(context: AudioContext);
    AttachAudioClip(audioClip: AudioClip): void;
    DetachAudioClip(clip: AudioClip): void;
    Send(channel: Channel): void;
    Unsend(): void;
    SetVolume(value: number): void;
    StopAll(): void;
    Dispose(): void;
    SetLabel(label: string): void;
}
//# sourceMappingURL=AudioClipPlayer.d.ts.map