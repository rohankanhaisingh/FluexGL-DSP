import { v4 } from "uuid";

import { AudioClip } from "./AudioClip";
import { Debug } from "../../utilities/debugger";
import { Master } from "./Master";

export class AudioClipPlayer {

    public label: string = "AudioClipPlayer";
    public id: string = v4();

    public audioClips: AudioClip[] = [];
    public outputGainNode: GainNode | null = null;

    constructor(master: Master) {
        this.outputGainNode = new GainNode(master.context);
    }

    public AttachAudioClip(audioClip: AudioClip) {

        if (this.audioClips.includes(audioClip)) return Debug.Error("Could not attach audio clip because it is already part of this channel", [
            "Call .DetachAudioClip([clip AudioClip]) before attaching audio clip."
        ]);
    }

    public SetLabel(label: string) {
        this.label = label;
    }
}