import { v4 } from "uuid";

import { AudioClip } from "./AudioClip";
import { Debug } from "../../utilities/debugger";
import { Channel } from "./Channel";
import { Master } from "./Master";
import { ErrorCodes } from "../../console-codes";

export class AudioClipPlayer {

    public label: string = "AudioClipPlayer";
    public id: string = v4();

    public audioClips: AudioClip[] = [];
    public outputGainNode: GainNode | null = null;

    public context: AudioContext | null = null;
    public channel: Channel | Master | null = null;

    constructor(context: AudioContext) {
        this.context = context;
        this.outputGainNode = new GainNode(context);
    }

    public attachAudioClip(audioClip: AudioClip): void {

        if (this.audioClips.includes(audioClip)) return Debug.Error("Could not attach audio clip because it is already part of this channel", [
            "Call .detachAudioClip([clip AudioClip]) before attaching audio clip."
        ], ErrorCodes.AUDIO_CLIP_ALREADY_ATTACHED);

        audioClip.initialize(this);
        this.audioClips.push(audioClip);
    }

    public detachAudioClip(clip: AudioClip): void {

        if (!this.audioClips.includes(clip)) return Debug.Error("Could not detach audio clip because it is not part of this channel", [
            "Call .attachAudioClip([clip AudioClip]) before detaching audio clip."
        ], ErrorCodes.AUDIO_CLIP_NOT_FOUND);

        const idx = this.audioClips.indexOf(clip);

        if (idx >= 0)
            this.audioClips.splice(idx, 1);

        clip.detachFromAudioClipPlayer(this);
    }

    public send(channel: Channel | Master): void {

        if (!this.outputGainNode || !channel.input) return Debug.Error("Could not send AudioClipPlayer signal to a channel/master.");

        this.unsend();

        this.channel = channel;
        this.outputGainNode.connect(channel.input);
    }

    public unsend(): void {

        if (!this.outputGainNode) return;

        if (this.channel && this.channel.input) {
            this.outputGainNode.disconnect(this.channel.input);
        } else {
            this.outputGainNode.disconnect();
        }

        this.channel = null;
    }

    public setVolume(value: number): void {

        if (!this.outputGainNode) return;

        if (value < 0) value = 0;
        if (value > 1) value = 1;

        this.outputGainNode.gain.value = value;
    }

    public stopAll(): void {

        this.audioClips.forEach(function (clip: AudioClip) {
            clip.stop();
        });
    }

    public dispose(): void {

        this.stopAll();
        this.unsend();
        this.outputGainNode?.disconnect();
        
        this.audioClips = [];
        this.outputGainNode = null;
        this.channel = null;
        this.context = null;
    }

    public setLabel(label: string): void {
        this.label = label;
    }

    public get length(): number {
        return this.audioClips.length;
    }

    public get volume(): number {
        return this.outputGainNode?.gain.value ?? 0;
    }
}
