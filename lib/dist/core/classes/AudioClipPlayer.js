import { v4 } from "uuid";
import { Debug } from "../../utilities/debugger";
export class AudioClipPlayer {
    label = "AudioClipPlayer";
    id = v4();
    audioClips = [];
    outputGainNode = null;
    constructor(master) {
        this.outputGainNode = new GainNode(master.context);
    }
    AttachAudioClip(audioClip) {
        if (this.audioClips.includes(audioClip))
            return Debug.Error("Could not attach audio clip because it is already part of this channel", [
                "Call .DetachAudioClip([clip AudioClip]) before attaching audio clip."
            ]);
    }
    SetLabel(label) {
        this.label = label;
    }
}
