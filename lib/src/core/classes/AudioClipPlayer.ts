import { v4 } from "uuid";

import { AudioClip } from "./AudioClip";
import { Debug } from "../../utilities/debugger";
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

    public AttachAudioClip(audioClip: AudioClip): void {

        if (this.audioClips.includes(audioClip)) return Debug.Error("Could not attach audio clip because it is already part of this channel", [
            "Call .DetachAudioClip([clip AudioClip]) before attaching audio clip."
        ]);

        audioClip.Initialize(this);
        this.audioClips.push(audioClip);
    }

    public DetachAudioClip(clip: AudioClip): void {

        if (!this.audioClips.includes(clip)) return Debug.Error("Could not detach audio clip because it is not part of this channel", [
            "Call .AttachAudioClip([clip AudioClip]) before detaching audio clip."
        ]);

        clip.Stop();

        const self = this;

        this.audioClips.forEach(function (_clip: AudioClip, index: number) {
            if (clip.id === _clip.id)
                return self.audioClips.splice(index, 1);
        })
    }

    public Send(channel: Channel): void {

        if (!this.outputGainNode || !channel.input) return Debug.Error("Could not send AudioClipPlayer signal to a channel.");

        this.Unsend();

        this.channel = channel;
        this.outputGainNode.connect(channel.input);
    }

    public Unsend(): void {

        if (!this.outputGainNode) return;

        if (this.channel && this.channel.input) {
            this.outputGainNode.disconnect(this.channel.input);
        } else {
            this.outputGainNode.disconnect();
        }

        this.channel = null;
    }

    public SetVolume(value: number): void {

        if (!this.outputGainNode) return;

        if (value < 0) value = 0;
        if (value > 1) value = 1;

        this.outputGainNode.gain.value = value;
    }

    public StopAll(): void {

        this.audioClips.forEach(function (clip: AudioClip) {
            clip.Stop();
        });
    }

    public Dispose(): void {

        this.StopAll();
        this.Unsend();
        this.outputGainNode?.disconnect();
        
        this.audioClips = [];
        this.outputGainNode = null;
        this.channel = null;
        this.context = null;
    }

    public SetLabel(label: string): void {
        this.label = label;
    }
}
