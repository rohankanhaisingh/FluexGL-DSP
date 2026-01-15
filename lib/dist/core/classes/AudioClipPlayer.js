import { v4 } from "uuid";
import { Debug } from "../../utilities/debugger";
import { ErrorCodes } from "lib/src/console-codes";
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
            ], ErrorCodes.AUDIO_CLIP_ALREADY_ATTACHED);
        audioClip.Initialize(this);
        this.audioClips.push(audioClip);
    }
    DetachAudioClip(clip) {
        if (!this.audioClips.includes(clip))
            return Debug.Error("Could not detach audio clip because it is not part of this channel", [
                "Call .AttachAudioClip([clip AudioClip]) before detaching audio clip."
            ], ErrorCodes.AUDIO_CLIP_NOT_FOUND);
        clip.Stop();
        const self = this;
        this.audioClips.forEach(function (_clip, index) {
            if (clip.id === _clip.id)
                return self.audioClips.splice(index, 1);
        });
    }
    Send(channel) {
        if (!this.outputGainNode || !channel.input)
            return Debug.Error("Could not send AudioClipPlayer signal to a channel/master.");
        this.Unsend();
        this.channel = channel;
        this.outputGainNode.connect(channel.input);
    }
    Unsend() {
        if (!this.outputGainNode)
            return;
        if (this.channel && this.channel.input) {
            this.outputGainNode.disconnect(this.channel.input);
        }
        else {
            this.outputGainNode.disconnect();
        }
        this.channel = null;
    }
    SetVolume(value) {
        if (!this.outputGainNode)
            return;
        if (value < 0)
            value = 0;
        if (value > 1)
            value = 1;
        this.outputGainNode.gain.value = value;
    }
    StopAll() {
        this.audioClips.forEach(function (clip) {
            clip.Stop();
        });
    }
    Dispose() {
        this.StopAll();
        this.Unsend();
        this.outputGainNode?.disconnect();
        this.audioClips = [];
        this.outputGainNode = null;
        this.channel = null;
        this.context = null;
    }
    SetLabel(label) {
        this.label = label;
    }
    get length() {
        return this.audioClips.length;
    }
    get volume() {
        return this.outputGainNode?.gain.value ?? 0;
    }
}
