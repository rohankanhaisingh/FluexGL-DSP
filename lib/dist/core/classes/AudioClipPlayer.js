import { v4 } from "uuid";
import { Debug } from "../../utilities/debugger";
import { ErrorCodes } from "../../console-codes";
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
    attachAudioClip(audioClip) {
        if (this.audioClips.includes(audioClip))
            return Debug.error("Could not attach audio clip because it is already part of this channel", [
                "Call .detachAudioClip([clip AudioClip]) before attaching audio clip."
            ], ErrorCodes.AUDIO_CLIP_ALREADY_ATTACHED);
        audioClip.initialize(this);
        this.audioClips.push(audioClip);
    }
    detachAudioClip(clip) {
        if (!this.audioClips.includes(clip))
            return Debug.error("Could not detach audio clip because it is not part of this channel", [
                "Call .attachAudioClip([clip AudioClip]) before detaching audio clip."
            ], ErrorCodes.AUDIO_CLIP_NOT_FOUND);
        const idx = this.audioClips.indexOf(clip);
        if (idx >= 0)
            this.audioClips.splice(idx, 1);
        clip.detachFromAudioClipPlayer(this);
    }
    send(channel) {
        if (!this.outputGainNode || !channel.input)
            return Debug.error("Could not send AudioClipPlayer signal to a channel/master.");
        this.unsend();
        this.channel = channel;
        this.outputGainNode.connect(channel.input);
    }
    unsend() {
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
    setVolume(value) {
        if (!this.outputGainNode)
            return;
        if (value < 0)
            value = 0;
        if (value > 1)
            value = 1;
        this.outputGainNode.gain.value = value;
    }
    stopAll() {
        this.audioClips.forEach(function (clip) {
            clip.stop();
        });
    }
    dispose() {
        this.stopAll();
        this.unsend();
        this.outputGainNode?.disconnect();
        this.audioClips = [];
        this.outputGainNode = null;
        this.channel = null;
        this.context = null;
    }
    setLabel(label) {
        this.label = label;
    }
    get length() {
        return this.audioClips.length;
    }
    get volume() {
        return this.outputGainNode?.gain.value ?? 0;
    }
}
