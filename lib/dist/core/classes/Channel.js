import { v4 } from "uuid";
import { Debug } from "../../utilities/debugger";
import { AudioClipPlayer } from "./AudioClipPlayer";
import { Master } from "./Master";
import { ErrorCodes } from "../../console-codes";
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
    constructor(context, label) {
        this.context = context;
        this.label = label ?? this.label;
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
        this.audioClipPlayer.send(this);
    }
    rebuildEffectChainInternal() {
        if (!this.input || !this.stereoPannerNode) {
            Debug.Error("Could not rebuild effect chain because one or more required audio nodes are undefined.", [
                `Channel id: ${this.id}.`,
                `Input defined: ${!!this.input}.`,
                `StereoPannerNode defined: ${!!this.stereoPannerNode}.`
            ]);
            return;
        }
        this.input.disconnect();
        for (const effect of this.effects)
            effect.audioWorkletNode?.disconnect();
        const activeEffects = this.effects.filter(function (e) {
            return !!e.audioWorkletNode;
        });
        if (activeEffects.length === 0) {
            this.input.connect(this.stereoPannerNode);
            return;
        }
        this.input.connect(activeEffects[0].audioWorkletNode);
        for (let i = 0; i < activeEffects.length - 1; i++) {
            const current = activeEffects[i].audioWorkletNode;
            const next = activeEffects[i + 1].audioWorkletNode;
            current.connect(next);
        }
        activeEffects[activeEffects.length - 1].audioWorkletNode.connect(this.stereoPannerNode);
    }
    disconnectAudioNodes(gc) {
        this.input?.disconnect();
        this.stereoPannerNode?.disconnect();
        this.analyserNode?.disconnect();
        this.gainNode?.disconnect();
        this.output?.disconnect();
        for (const effect of this.effects) {
            effect.audioWorkletNode?.disconnect();
        }
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
    /**
     * Public method to manually rebuild the effect chain.
     * Can be useful when the automatic rebuilt did not
     * work properly.
     * @returns
     */
    rebuildEffectChain() {
        return this.rebuildEffectChainInternal();
    }
    addEffect(effect) {
        if (!this.context)
            throw new Error(`Could not add effect (${effect.id}), to channel (${this.id}), because the channel's AudioContext is undefined.`);
        if (this.effects.includes(effect))
            throw new Error(`Could not add effect (${effect.id}), to channel (${this.id}), because it has already been added to the channel.`);
        this.effects.push(effect);
        effect.initializeOnAttachment(this.context);
        this.rebuildEffectChainInternal();
        return this;
    }
    attachEffect(effect) {
        return this.addEffect(effect);
    }
    removeEffect(effect) {
        if (!this.effects.includes(effect)) {
            Debug.Error("Could not remove effect, because it is not part of this channel.", [
                "Call .addEffect([effect Effector]) before removing effect."
            ], ErrorCodes.EFFECT_NOT_FOUND);
            return;
        }
        const self = this;
        this.effects.forEach(function (_effect, index) {
            if (effect.id === _effect.id)
                self.effects.splice(index, 1);
        });
        effect.audioWorkletNode?.disconnect();
        this.rebuildEffectChainInternal();
    }
    removeAllEffects() {
        for (const effect of this.effects) {
            this.removeEffect(effect);
        }
    }
    detachEffect(effect) {
        return this.removeEffect(effect);
    }
    detachAllEffects() {
        return this.removeAllEffects();
    }
    send(channel) {
        if (channel instanceof Master)
            return channel.attachChannel(this);
        if (channel.id === this.id)
            return Debug.Error("Could not link channel to itself.", [
                `This channel id: ${this.id}`
            ], ErrorCodes.CHANNEL_CANNOT_LINK_TO_ITSELF);
        if (!this.isInitialized() || !channel.isInitialized())
            return Debug.Error("Could not link channels because one (or both) channels are not initialized.", [
                `This channel id: ${this.id} initialized: ${this.isInitialized()}`,
                `Target channel id: ${channel.id} initialized: ${channel.isInitialized()}`
            ], ErrorCodes.CHANNEL_NOT_INITIALIZED);
        if (this.context !== channel.context)
            return Debug.Error("Could not link channels because they do not share the same AudioContext.", [
                `This channel context: ${this.context ? "set" : "null"}`,
                `Target channel context: ${channel.context ? "set" : "null"}`
            ], ErrorCodes.CHANNEL_NOT_SAME_AUDIO_CONTEXT);
        if (this.sends.includes(channel))
            return Debug.Error("Could not link channels, because the given channel is already linked with this one.", [
                `This channel id: ${this.id}`,
                `Target channel id: ${channel.id}`
            ], ErrorCodes.CHANNEL_ALREADY_LINKED);
        if (channel.isReachable(this))
            return Debug.Error("Could not link channels because it would create a feedback loop.", [
                `This channel id: ${this.id}`,
                `Target channel id: ${channel.id}`
            ], ErrorCodes.CHANNEL_POSSIBLE_FEEDBACK_LOOP);
        this.output.connect(channel.input);
        this.sends.push(channel);
    }
    unsend(channel) {
        if (channel instanceof Master)
            return channel.detachChannel(this);
        const idx = this.sends.indexOf(channel);
        if (idx === -1)
            return;
        if (this.output && channel.input)
            this.output.disconnect(channel.input);
        this.sends.splice(idx, 1);
    }
    hasAudioClipPlayer() {
        return !!this.audioClipPlayer;
    }
    unsendToAllChannels() {
        for (var i = 0; i < this.sends.length; i++) {
            this.unsend(this.sends[i]);
            i--;
        }
    }
    attachAudioClip(audioClip) {
        if (!this.audioClipPlayer)
            throw Error("Cannot not link AudioClip to this channel because this channel's AudioClipPlayer is undefined.");
        this.audioClipPlayer.attachAudioClip(audioClip);
        return this;
    }
    volume(volume) {
        if (!this.context)
            throw new Error("Could not set volume on channel, because it's context is undefined.");
        if (!this.gainNode)
            throw new Error("Could not set volume on channel, because it's GainNode is undefined.");
        volume && this.gainNode.gain.setValueAtTime(volume, this.context.currentTime);
        return volume ?? this.gainNode.gain.value;
    }
    pan(pan) {
        if (!this.context)
            throw new Error("Could not set pan on channel, because it's context is undefined.");
        if (!this.stereoPannerNode)
            throw new Error("Cannot set pan on channel, because it's StereoPannerNode is undefined.");
        pan && this.stereoPannerNode.pan.setValueAtTime(pan, this.context.currentTime);
        return pan ?? this.stereoPannerNode.pan.value;
    }
    getEffectsByLabel(label) {
        return this.effects.filter(effect => effect.label === label);
    }
    getFirstEffectByLabel(label) {
        const filteredEffects = this.effects.filter(effect => effect.label === label);
        return filteredEffects.length !== 0 ? filteredEffects[0] : null;
    }
    getEffectById(id) {
        return this.effects.filter(effect => effect.id === id);
    }
    getFirstEffectById(id) {
        const filteredEffects = this.effects.filter(effect => effect.id === id);
        return filteredEffects.length !== 0 ? filteredEffects[0] : null;
    }
    moveEffectToIndex(effect, index) {
        let fromIndex = -1, matches = 0, i = 0;
        for (i = 0; i < this.effects.length; i++) {
            if (this.effects[i].id === effect.id) {
                if (fromIndex === -1)
                    fromIndex = i;
                matches++;
            }
        }
        if (matches === 0)
            throw new Error("Effect '" + effect.id + "' (" + effect.label + ") could not be found. " +
                "The effect ID may have changed, or the effect is not attached to this channel.");
        if (matches > 1)
            throw new Error("Multiple effects with the ID '" + effect.id + "' are attached to this channel. " +
                "Make sure every effect has a unique ID.");
        let toIndex;
        if (typeof index === "number") {
            toIndex = index;
        }
        else {
            switch (index) {
                case "start":
                    toIndex = 0;
                    break;
                case "end":
                    toIndex = this.effects.length - 1;
                    break;
                case "one-after-start":
                    toIndex = 1;
                    break;
                case "one-before-end":
                    toIndex = this.effects.length - 2;
                    break;
                default:
                    throw new Error("Invalid ArrayPosition: " + String(index));
            }
        }
        if (toIndex < 0)
            toIndex = 0;
        if (toIndex >= this.effects.length)
            toIndex = this.effects.length - 1;
        if (fromIndex === toIndex)
            return;
        const item = this.effects.splice(fromIndex, 1)[0];
        if (fromIndex < toIndex)
            toIndex = toIndex - 1;
        this.effects.splice(toIndex, 0, item);
        // Initializing the effect is unnessecary because it should have been intialized already
        // otherwise it could not been found. Rebuilding the effect chain is nessecary though.
        this.rebuildEffectChainInternal();
    }
}
