import { v4 } from "uuid";
import { Debug } from "../../utilities/debugger";
import { AudioClipPlayer } from "./AudioClipPlayer";
import { Master } from "./Master";
export class Channel {
    id = v4();
    label = "Channel";
    input = null;
    stereoPannerNode = null;
    analyserNode = null;
    gainNode = null;
    output = null;
    effects = [];
    context = null;
    sends = [];
    audioClipPlayer = null;
    constructor(context) {
        this.context = context;
        this.disconnectAudioNodes(true);
        this.input = new GainNode(context);
        this.stereoPannerNode = new StereoPannerNode(context);
        this.analyserNode = new AnalyserNode(context);
        this.gainNode = new GainNode(context);
        this.output = new GainNode(context);
        this.audioClipPlayer = new AudioClipPlayer(context);
        this.input.connect(this.stereoPannerNode);
        this.stereoPannerNode.connect(this.analyserNode);
        this.analyserNode.connect(this.gainNode);
        this.gainNode.connect(this.output);
        this.audioClipPlayer.Send(this);
    }
    disconnectAudioNodes(gc) {
        this.input?.disconnect();
        this.stereoPannerNode?.disconnect();
        this.analyserNode?.disconnect();
        this.gainNode?.disconnect();
        this.output?.disconnect();
        if (gc) {
            this.input = null;
            this.stereoPannerNode = null;
            this.analyserNode = null;
            this.gainNode = null;
            this.output = null;
        }
    }
    isInitialized() {
        return !!(this.context && this.input && this.output);
    }
    isReachable(target) {
        const visited = new Set();
        const stack = [this];
        while (stack.length > 0) {
            const current = stack.pop();
            if (current.id === target.id)
                return true;
            if (visited.has(current.id))
                continue;
            visited.add(current.id);
            for (let i = 0; i < current.sends.length; i++)
                stack.push(current.sends[i]);
        }
        return false;
    }
    Send(channel) {
        if (channel instanceof Master)
            return channel.AttachChannel(this);
        if (channel.id === this.id)
            return Debug.Error("Could not link channel to itself.", [
                `This channel id: ${this.id}`
            ]);
        if (!this.isInitialized() || !channel.isInitialized())
            return Debug.Error("Could not link channels because one (or both) channels are not initialized.", [
                `This channel id: ${this.id} initialized: ${this.isInitialized()}`,
                `Target channel id: ${channel.id} initialized: ${channel.isInitialized()}`
            ]);
        if (this.context !== channel.context)
            return Debug.Error("Could not link channels because they do not share the same AudioContext.", [
                `This channel context: ${this.context ? "set" : "null"}`,
                `Target channel context: ${channel.context ? "set" : "null"}`
            ]);
        if (this.sends.includes(channel))
            return Debug.Error("Could not link channels, because the given channel is already linked with this one.", [
                `This channel id: ${this.id}`,
                `Target channel id: ${channel.id}`
            ]);
        if (channel.isReachable(this))
            return Debug.Error("Could not link channels because it would create a feedback loop.", [
                `This channel id: ${this.id}`,
                `Target channel id: ${channel.id}`
            ]);
        this.output.connect(channel.input);
        this.sends.push(channel);
    }
    Unsend(channel) {
        if (channel instanceof Master)
            return channel.DetachChannel(this);
        const idx = this.sends.indexOf(channel);
        if (idx === -1)
            return;
        if (this.output && channel.input)
            this.output.disconnect(channel.input);
        this.sends.splice(idx, 1);
    }
    HasAudioClipPlayer() {
        return !!this.audioClipPlayer;
    }
    UnsendToAllChannels() {
        for (var i = 0; i < this.sends.length; i++) {
            this.Unsend(this.sends[i]);
            i--;
        }
    }
    AttachAudioClip(audioClip) {
        if (!this.audioClipPlayer)
            return Debug.Error("Cannot not link AudioClip to this channel because this channel's AudioClipPlayer is undefined.");
        this.audioClipPlayer.AttachAudioClip(audioClip);
    }
}
