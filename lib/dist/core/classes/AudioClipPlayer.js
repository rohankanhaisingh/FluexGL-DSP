import { v4 } from "uuid";
import { Debug } from "../../utilities/debugger";
export class AudioClipPlayer {
    label = "AudioClipPlayer";
    id = v4();
    audioClips = [];
    outputGainNode = null;
    context = null;
    channel = null;
    constructor(context) {
        this.context = context;
        this.outputGainNode = new GainNode(context);
    }
    AttachAudioClip(audioClip) {
        if (this.audioClips.includes(audioClip))
            return Debug.Error("Could not attach audio clip because it is already part of this channel", [
                "Call .DetachAudioClip([clip AudioClip]) before attaching audio clip."
            ]);
        audioClip.Initialize(this);
        this.audioClips.push(audioClip);
    }
    Send(channel) {
        if (!this.outputGainNode || !channel.input)
            return Debug.Error("Could not send AudioClipPlayer signal to a channel.");
        this.channel = channel;
        this.outputGainNode.connect(channel.input);
    }
    SetLabel(label) {
        this.label = label;
    }
}
