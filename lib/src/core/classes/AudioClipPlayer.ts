import { v4 } from "uuid";

import { AudioClip } from "./AudioClip";
import { Debug } from "../../utilities/debugger";
import { Master } from "./Master";
import { Channel } from "./Channel";

export class AudioClipPlayer {

    public label: string = "AudioClipPlayer";
    public id: string = v4();

    public audioClips: AudioClip[] = [];
    public outputGainNode: GainNode | null = null;

    public context: AudioContext | null = null;
    public channel: Channel | null = null;

    constructor(context: AudioContext) {
        this.context = context;
        this.outputGainNode = new GainNode(context);
    }

    public AttachAudioClip(audioClip: AudioClip) {

        if (this.audioClips.includes(audioClip)) return Debug.Error("Could not attach audio clip because it is already part of this channel", [
            "Call .DetachAudioClip([clip AudioClip]) before attaching audio clip."
        ]);

        audioClip.Initialize(this);
        this.audioClips.push(audioClip);
    }

    public Send(channel: Channel) {

        if(!this.outputGainNode || !channel.input) return Debug.Error("Could not send AudioClipPlayer signal to a channel.");

        this.channel = channel;
        this.outputGainNode.connect(channel.input);
    }

    public SetLabel(label: string) {
        this.label = label;
    }
}