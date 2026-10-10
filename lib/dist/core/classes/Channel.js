import { v4 } from "uuid";
import { Debug } from "../../utilities/debugger";
import { AudioClipPlayer } from "./AudioClipPlayer";
import { Master } from "./Master";
import { ErrorCodes } from "../../console-codes";
/**
 * A mixer channel (bus): input -> effects -> [panner] -> [analyser] -> gain (output).
 *
 * A channel is kept as light as possible, because a game can have many of them. The
 * StereoPannerNode is only created once the channel is panned away from the centre, the
 * AnalyserNode only by {@link enableAnalyser}, and the AudioClipPlayer only once a clip is
 * attached. `output` is the same node as `gainNode`.
 *
 * Per game object, prefer a SpatialAudioSource (two GainNodes) over a channel, and use
 * channels as buses (for example "Effects", "Entities", "UI", "Ambience" and "Voice chat").
 */
export class Channel {
    id = v4();
    label = "Channel";
    input = null;
    /** Created on demand by {@link pan}. */
    stereoPannerNode = null;
    /** Created on demand by {@link enableAnalyser}. */
    analyserNode = null;
    gainNode = null;
    output = null;
    effects = [];
    context = null;
    sends = [];
    /** Master channels this channel is attached to. Maintained by {@link Master.attachChannel} and {@link Master.detachChannel}. */
    masters = [];
    clipPlayer = null;
    constructor(context, label) {
        this.context = context;
        this.label = label ?? this.label;
        this.input = new GainNode(context);
        this.gainNode = new GainNode(context);
        this.output = this.gainNode;
        this.input.connect(this.gainNode);
    }
    /**
     * The player for audio clips attached directly to this channel. Created on first access,
     * so channels that never play clips themselves do not carry an extra node.
     */
    get audioClipPlayer() {
        if (!this.clipPlayer && this.context && this.input) {
            this.clipPlayer = new AudioClipPlayer(this.context);
            this.clipPlayer.send(this);
        }
        return this.clipPlayer;
    }
    rebuildEffectChainInternal() {
        if (!this.input || !this.gainNode) {
            Debug.error("Could not rebuild effect chain because one or more required audio nodes are undefined.", [
                `Channel id: ${this.id}.`,
                `Input defined: ${!!this.input}.`,
                `GainNode defined: ${!!this.gainNode}.`
            ]);
            return;
        }
        this.input.disconnect();
        this.stereoPannerNode?.disconnect();
        this.analyserNode?.disconnect();
        for (const effect of this.effects)
            effect.outputNode?.disconnect();
        let current = this.input;
        for (const effect of this.effects) {
            if (!effect.inputNode || !effect.outputNode)
                continue;
            current.connect(effect.inputNode);
            current = effect.outputNode;
        }
        if (this.stereoPannerNode) {
            current.connect(this.stereoPannerNode);
            current = this.stereoPannerNode;
        }
        if (this.analyserNode) {
            current.connect(this.analyserNode);
            current = this.analyserNode;
        }
        current.connect(this.gainNode);
    }
    disconnectAudioNodes(gc) {
        this.input?.disconnect();
        this.stereoPannerNode?.disconnect();
        this.analyserNode?.disconnect();
        this.gainNode?.disconnect();
        this.output?.disconnect();
        for (const effect of this.effects) {
            effect.outputNode?.disconnect();
        }
        if (gc) {
            this.input = null;
            this.stereoPannerNode = null;
            this.analyserNode = null;
            this.gainNode = null;
            this.output = null;
        }
    }
    /**
     * Inserts an AnalyserNode after the effects (and panner) of this channel, and returns it.
     * Channels have no analyser by default, because it costs processing time on every channel.
     */
    enableAnalyser(options) {
        if (!this.context)
            throw new Error("Could not enable the analyser on channel, because it's context is undefined.");
        if (!this.analyserNode) {
            this.analyserNode = new AnalyserNode(this.context, options);
            this.rebuildEffectChainInternal();
        }
        return this.analyserNode;
    }
    /**
     * Removes the AnalyserNode created by {@link enableAnalyser}.
     */
    disableAnalyser() {
        if (!this.analyserNode)
            return;
        this.analyserNode.disconnect();
        this.analyserNode = null;
        this.rebuildEffectChainInternal();
    }
    /**
     * Stops the clips of this channel, removes all of its outgoing links and releases its audio nodes.
     * Channels sending to this channel should call `.unsend(channel)` themselves; until then their
     * signal simply ends here.
     */
    dispose() {
        this.clipPlayer?.dispose();
        this.clipPlayer = null;
        this.unsendFromAll();
        this.disconnectAudioNodes(true);
        this.effects = [];
        this.context = null;
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
            Debug.error("Could not remove effect, because it is not part of this channel.", [
                "Call .addEffect([effect Effector]) before removing effect."
            ], ErrorCodes.EFFECT_NOT_FOUND);
            return;
        }
        const self = this;
        this.effects.forEach(function (_effect, index) {
            if (effect.id === _effect.id)
                self.effects.splice(index, 1);
        });
        effect.outputNode?.disconnect();
        this.rebuildEffectChainInternal();
    }
    removeAllEffects() {
        for (const effect of [...this.effects]) {
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
            return Debug.error("Could not link channel to itself.", [
                `This channel id: ${this.id}`
            ], ErrorCodes.CHANNEL_CANNOT_LINK_TO_ITSELF);
        if (!this.isInitialized() || !channel.isInitialized())
            return Debug.error("Could not link channels because one (or both) channels are not initialized.", [
                `This channel id: ${this.id} initialized: ${this.isInitialized()}`,
                `Target channel id: ${channel.id} initialized: ${channel.isInitialized()}`
            ], ErrorCodes.CHANNEL_NOT_INITIALIZED);
        if (this.context !== channel.context)
            return Debug.error("Could not link channels because they do not share the same AudioContext.", [
                `This channel context: ${this.context ? "set" : "null"}`,
                `Target channel context: ${channel.context ? "set" : "null"}`
            ], ErrorCodes.CHANNEL_NOT_SAME_AUDIO_CONTEXT);
        if (this.sends.includes(channel))
            return Debug.error("Could not link channels, because the given channel is already linked with this one.", [
                `This channel id: ${this.id}`,
                `Target channel id: ${channel.id}`
            ], ErrorCodes.CHANNEL_ALREADY_LINKED);
        if (channel.isReachable(this))
            return Debug.error("Could not link channels because it would create a feedback loop.", [
                `This channel id: ${this.id}`,
                `Target channel id: ${channel.id}`
            ], ErrorCodes.CHANNEL_POSSIBLE_FEEDBACK_LOOP);
        this.output.connect(channel.input);
        this.sends.push(channel);
    }
    /**
     * Stops sending the signal of this channel to the given channel or master channel.
     * Unsending from a target this channel is not sent to does nothing, so it is safe to call at any time.
     *
     * @returns `true` when the link has been removed, `false` when there was no link.
     */
    unsend(channel) {
        if (channel instanceof Master)
            return channel.hasChannel(this) && channel.detachChannel(this);
        const idx = this.sends.indexOf(channel);
        if (idx === -1)
            return false;
        if (this.output && channel.input) {
            try {
                this.output.disconnect(channel.input);
            }
            catch {
                // The nodes were not connected (anymore), which is the desired end state anyway.
            }
        }
        this.sends.splice(idx, 1);
        return true;
    }
    /**
     * Whether the signal of this channel is sent to the given channel or master channel.
     */
    isSentTo(channel) {
        return channel instanceof Master
            ? this.masters.includes(channel)
            : this.sends.includes(channel);
    }
    /**
     * Whether audio clips can be attached to this channel. The player itself is created on demand.
     */
    hasAudioClipPlayer() {
        return this.isInitialized();
    }
    unsendToAllChannels() {
        for (const channel of [...this.sends])
            this.unsend(channel);
    }
    /**
     * Detaches this channel from every master channel it is attached to.
     */
    unsendFromAllMasters() {
        for (const master of [...this.masters])
            this.unsend(master);
    }
    /**
     * Removes every outgoing link of this channel, both to channels and to master channels.
     */
    unsendFromAll() {
        this.unsendToAllChannels();
        this.unsendFromAllMasters();
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
        if (volume !== undefined)
            this.gainNode.gain.setValueAtTime(volume, this.context.currentTime);
        return volume ?? this.gainNode.gain.value;
    }
    /**
     * Sets or returns the stereo pan of this channel. The StereoPannerNode is only created
     * once the channel is panned away from the centre.
     */
    pan(pan) {
        if (!this.context)
            throw new Error("Could not set pan on channel, because it's context is undefined.");
        if (pan === undefined)
            return this.stereoPannerNode?.pan.value ?? 0;
        if (!this.stereoPannerNode) {
            if (pan === 0)
                return 0;
            this.stereoPannerNode = new StereoPannerNode(this.context);
            this.rebuildEffectChainInternal();
        }
        this.stereoPannerNode.pan.setValueAtTime(pan, this.context.currentTime);
        return pan;
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
