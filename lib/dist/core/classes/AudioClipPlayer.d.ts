import { AudioClip } from "./AudioClip";
import { Master } from "./Master";
export declare class AudioClipPlayer {
    label: string;
    id: string;
    audioClips: AudioClip[];
    outputGainNode: GainNode | null;
    constructor(master: Master);
    AttachAudioClip(audioClip: AudioClip): void;
    SetLabel(label: string): void;
}
//# sourceMappingURL=AudioClipPlayer.d.ts.map