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
    attachAudioClip(audioClip: AudioClip): void;
    detachAudioClip(clip: AudioClip): void;
    send(channel: Channel | Master): void;
    unsend(): void;
    setVolume(value: number): void;
    stopAll(): void;
    dispose(): void;
    setLabel(label: string): void;
    get length(): number;
    get volume(): number;
}
//# sourceMappingURL=AudioClipPlayer.d.ts.map