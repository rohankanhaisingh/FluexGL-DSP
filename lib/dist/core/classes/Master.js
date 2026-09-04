import { v4 } from "uuid";
import { Debug } from "../../utilities/debugger";
import { AudioClipPlayer } from "./AudioClipPlayer";
import { ErrorCodes } from "../../console-codes";
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
        this.audioClipPlayer.send(this);
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
    attachEffect(effect) {
        if (this.effects.includes(effect))
            return Debug.error("Could not attach the effect because it is already part of this master channel.", [
                "Call .detachEffect([effect Effector]) before attaching the effect."
            ], ErrorCodes.EFFECT_ALREADY_ATTACHED);
        if (!this.context)
            return this.rebuildEffectChain();
        this.effects.push(effect);
        effect.initializeOnAttachment(this.context);
        this.rebuildEffectChain();
    }
    detachEffect(effect) {
        if (!this.effects.includes(effect))
            return Debug.error("Could not detach the effect because it is not part of this master channel.", [
                "Call .attachEffect([effect Effector]) before detaching the effect."
            ], ErrorCodes.EFFECT_NOT_FOUND);
        const self = this;
        this.effects.forEach(function (_effect, index) {
            if (effect.id === _effect.id) {
                self.effects.splice(index, 1);
                return;
            }
        });
        this.rebuildEffectChain();
    }
    attachChannel(channel) {
        if (this.channels.includes(channel))
            return Debug.error("Could not attach the channel because it is already part of this master channel.", [
                "Call .detachChannel([channel Channel]) before attaching the channel."
            ], ErrorCodes.CHANNEL_ALREADY_ATTACHED);
        this.channels.push(channel);
        if (channel.output && this.input)
            channel.output.connect(this.input);
        return;
    }
    detachChannel(channel) {
        if (!this.channels.includes(channel))
            return Debug.error("Could not detach the channel because it is not part of this master channel.", [
                "Call .attachChannel([channel Channel]) before detaching the channel."
            ], ErrorCodes.CHANNEL_NOT_FOUND);
        if (channel.output && this.input)
            channel.output.disconnect(this.input);
        const self = this;
        this.channels.forEach(function (_channel, index) {
            if (channel.id !== _channel.id)
                return;
            self.channels.splice(index, 1);
        });
    }
    hasAudioClipPlayer() {
        return !!this.audioClipPlayer;
    }
    attachAudioClip(audioClip) {
        if (!this.audioClipPlayer)
            return Debug.error("Cannot not link AudioClip to this channel because this channel's AudioClipPlayer is undefined.");
        this.audioClipPlayer.attachAudioClip(audioClip);
    }
}
