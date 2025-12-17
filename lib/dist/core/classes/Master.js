import { v4 } from "uuid";
import { Debug } from "../../utilities/debugger";
import { AudioClipPlayer } from "./AudioClipPlayer";
export class Master {
    id = v4();
    channels = [];
    effects = [];
    input = null;
    gainNode = null;
    analyserNode = null;
    context = null;
    audioClipPlayer = null;
    constructor(context) {
        this.context = context;
        this.disconnectAudioNodes();
        this.audioClipPlayer = new AudioClipPlayer(context);
        this.input = new GainNode(context);
        this.gainNode = new GainNode(context);
        this.analyserNode = new AnalyserNode(context);
        this.input.connect(this.gainNode);
        this.gainNode.connect(this.analyserNode);
        this.analyserNode.connect(this.context.destination);
        this.audioClipPlayer.Send(this);
    }
    disconnectAudioNodes() {
        if (this.input)
            this.input.disconnect();
        if (this.gainNode)
            this.gainNode.disconnect();
        if (this.analyserNode)
            this.analyserNode.disconnect();
        this.effects.forEach(function (effect) {
            if (effect.audioWorkletNode)
                effect.audioWorkletNode.disconnect();
        });
    }
    rebuildEffectChain() {
        if (!this.context)
            return;
        if (!this.input || !this.gainNode || !this.analyserNode)
            return;
        this.disconnectAudioNodes();
        let currentNode = this.input;
        this.effects.forEach(function (effect) {
            if (!effect.audioWorkletNode)
                return;
            currentNode.connect(effect.audioWorkletNode);
            currentNode = effect.audioWorkletNode;
        });
        currentNode.connect(this.gainNode);
        this.gainNode.connect(this.analyserNode);
        this.analyserNode.connect(this.context.destination);
    }
    AttachEffect(effect) {
        if (this.effects.includes(effect))
            return Debug.Error("Could not attach the effect because it is already part of this master channel.", [
                "Call .DetachEffect([effect Effector]) before attaching the effect."
            ]);
        if (!this.context)
            return this.rebuildEffectChain();
        this.effects.push(effect);
        effect.InitializeOnAttachment(this.context);
        this.rebuildEffectChain();
    }
    DetachEffect(effect) {
        if (!this.effects.includes(effect))
            return Debug.Error("Could not detach the effect because it is not part of this master channel.", [
                "Call .AttachEffect([effect Effector]) before detaching the effect."
            ]);
        const self = this;
        this.effects.forEach(function (_effect, index) {
            if (effect.id === _effect.id) {
                self.effects.splice(index, 1);
                return;
            }
        });
        this.rebuildEffectChain();
    }
    AttachChannel(channel) {
        if (this.channels.includes(channel))
            return Debug.Error("Could not attach the channel because it is already part of this master channel.", [
                "Call .DetachChannel([channel Channel]) before attaching the channel."
            ]);
        this.channels.push(channel);
        if (channel.output && this.input)
            channel.output.connect(this.input);
        return;
    }
    DetachChannel(channel) {
        if (!this.channels.includes(channel))
            return Debug.Error("Could not detach the channel because it is not part of this master channel.", [
                "Call .AttachChannel([channel Channel]) before detaching the channel."
            ]);
        if (channel.output && this.input)
            channel.output.disconnect(this.input);
        const self = this;
        this.channels.forEach(function (_channel, index) {
            if (channel.id !== _channel.id)
                return;
            self.channels.splice(index, 1);
        });
    }
    HasAudioClipPlayer() {
        return !!this.audioClipPlayer;
    }
    AttachAudioClip(audioClip) {
        if (!this.audioClipPlayer)
            return Debug.Error("Cannot not link AudioClip to this channel because this channel's AudioClipPlayer is undefined.");
        this.audioClipPlayer.AttachAudioClip(audioClip);
    }
}
