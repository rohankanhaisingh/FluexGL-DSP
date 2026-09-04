import { v4 } from "uuid";

import { Debug } from "../../utilities/debugger";
import { AudioClipPlayer } from "./AudioClipPlayer";
import { AudioClip } from "./AudioClip";
import { Master } from "./Master";
import { Effector } from "./Effector";
import { ErrorCodes } from "../../console-codes";
import { ArrayPosition } from "../../typings";

export class Channel {

    public id: string = v4();
    public label: string = "Channel";

    public input: AudioNode | null = null;
    public stereoPannerNode: StereoPannerNode | null = null;
    public analyserNode: AnalyserNode | null = null;
    public gainNode: GainNode | null = null;
    public output: AudioNode | null = null;

    public effects: Effector[] = [];
    public context: AudioContext | null = null;

    public sends: Channel[] = [];
    public audioClipPlayer: AudioClipPlayer | null = null;

    constructor(context: AudioContext, label?: string) {
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

    private rebuildEffectChainInternal(): void {

        if (!this.input || !this.stereoPannerNode) {
            Debug.error("Could not rebuild effect chain because one or more required audio nodes are undefined.", [
                `Channel id: ${this.id}.`,
                `Input defined: ${!!this.input}.`,
                `StereoPannerNode defined: ${!!this.stereoPannerNode}.`
            ]);
            return;
        }

        this.input.disconnect();

        for (const effect of this.effects)
            effect.audioWorkletNode?.disconnect();

        const activeEffects = this.effects.filter(function (e: Effector): boolean {
            return !!e.audioWorkletNode;
        });

        if (activeEffects.length === 0) {
            this.input.connect(this.stereoPannerNode);
            return;
        }

        this.input.connect(activeEffects[0].audioWorkletNode as AudioNode);

        for (let i: number = 0; i < activeEffects.length - 1; i++) {

            const current = activeEffects[i].audioWorkletNode as AudioNode;
            const next = activeEffects[i + 1].audioWorkletNode as AudioNode;

            current.connect(next);
        }

        (activeEffects[activeEffects.length - 1].audioWorkletNode as AudioNode).connect(this.stereoPannerNode);
    }

    private disconnectAudioNodes(gc?: boolean) {

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

    private isInitialized(): boolean {
        return !!(this.context && this.input && this.output);
    }

    private isReachable(target: Channel): boolean {

        const visited: Set<string> = new Set<string>();
        const stack: Channel[] = [this];

        while (stack.length > 0) {

            const current: Channel = stack.pop() as Channel;

            if (current.id === target.id)
                return true;

            if (visited.has(current.id))
                continue;

            visited.add(current.id);

            for (let i: number = 0; i < current.sends.length; i++)
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
    public rebuildEffectChain() {
        return this.rebuildEffectChainInternal();
    }

    public addEffect(effect: Effector): Channel {

        if (!this.context)
            throw new Error(`Could not add effect (${effect.id}), to channel (${this.id}), because the channel's AudioContext is undefined.`);

        if (this.effects.includes(effect))
            throw new Error(`Could not add effect (${effect.id}), to channel (${this.id}), because it has already been added to the channel.`);

        this.effects.push(effect);
        effect.initializeOnAttachment(this.context);
        this.rebuildEffectChainInternal();
        return this;
    }

    public attachEffect(effect: Effector): Channel {
        return this.addEffect(effect);
    }

    public removeEffect(effect: Effector): void {

        if (!this.effects.includes(effect)) {
            Debug.error("Could not remove effect, because it is not part of this channel.", [
                "Call .addEffect([effect Effector]) before removing effect."
            ], ErrorCodes.EFFECT_NOT_FOUND);
            return;
        }

        const self: Channel = this;

        this.effects.forEach(function (_effect: Effector, index: number): void {
            if (effect.id === _effect.id)
                self.effects.splice(index, 1);
        });

        effect.audioWorkletNode?.disconnect();

        this.rebuildEffectChainInternal();
    }

    public removeAllEffects() {
        for (const effect of this.effects) {
            this.removeEffect(effect);
        }
    }

    public detachEffect(effect: Effector): void {
        return this.removeEffect(effect);
    }

    public detachAllEffects() {
        return this.removeAllEffects();
    }

    public send(channel: Channel | Master) {

        if (channel instanceof Master)
            return (channel as Master).attachChannel(this);

        if (channel.id === this.id) return Debug.error("Could not link channel to itself.", [
            `This channel id: ${this.id}`
        ], ErrorCodes.CHANNEL_CANNOT_LINK_TO_ITSELF);

        if (!this.isInitialized() || !channel.isInitialized()) return Debug.error("Could not link channels because one (or both) channels are not initialized.", [
            `This channel id: ${this.id} initialized: ${this.isInitialized()}`,
            `Target channel id: ${channel.id} initialized: ${channel.isInitialized()}`
        ], ErrorCodes.CHANNEL_NOT_INITIALIZED);

        if (this.context !== channel.context) return Debug.error("Could not link channels because they do not share the same AudioContext.", [
            `This channel context: ${this.context ? "set" : "null"}`,
            `Target channel context: ${channel.context ? "set" : "null"}`
        ], ErrorCodes.CHANNEL_NOT_SAME_AUDIO_CONTEXT);

        if (this.sends.includes(channel)) return Debug.error("Could not link channels, because the given channel is already linked with this one.", [
            `This channel id: ${this.id}`,
            `Target channel id: ${channel.id}`
        ], ErrorCodes.CHANNEL_ALREADY_LINKED);

        if (channel.isReachable(this)) return Debug.error("Could not link channels because it would create a feedback loop.", [
            `This channel id: ${this.id}`,
            `Target channel id: ${channel.id}`
        ], ErrorCodes.CHANNEL_POSSIBLE_FEEDBACK_LOOP);

        (this.output as AudioNode).connect(channel.input as AudioNode);

        this.sends.push(channel);
    }

    public unsend(channel: Channel | Master) {

        if (channel instanceof Master)
            return (channel as Master).detachChannel(this);

        const idx: number = this.sends.indexOf(channel);

        if (idx === -1) return;

        if (this.output && channel.input)
            this.output.disconnect(channel.input);

        this.sends.splice(idx, 1);
    }

    public hasAudioClipPlayer(): boolean {
        return !!this.audioClipPlayer;
    }

    public unsendToAllChannels() {
        for (var i: number = 0; i < this.sends.length; i++) {
            this.unsend(this.sends[i]);
            i--;
        }
    }

    public attachAudioClip(audioClip: AudioClip): Channel {

        if (!this.audioClipPlayer) throw Error("Cannot not link AudioClip to this channel because this channel's AudioClipPlayer is undefined.");

        this.audioClipPlayer.attachAudioClip(audioClip);
        return this;
    }

    public volume(volume?: number): number {

        if (!this.context) throw new Error("Could not set volume on channel, because it's context is undefined.");
        if (!this.gainNode) throw new Error("Could not set volume on channel, because it's GainNode is undefined.")

        volume && this.gainNode.gain.setValueAtTime(volume, this.context.currentTime);
        return volume ?? this.gainNode.gain.value;
    }

    public pan(pan?: number): number {

        if (!this.context) throw new Error("Could not set pan on channel, because it's context is undefined.");
        if (!this.stereoPannerNode) throw new Error("Cannot set pan on channel, because it's StereoPannerNode is undefined.");

        pan && this.stereoPannerNode.pan.setValueAtTime(pan, this.context.currentTime);
        return pan ?? this.stereoPannerNode.pan.value;
    }

    public getEffectsByLabel(label: string): Effector[] {
        return this.effects.filter(effect => effect.label === label);
    }

    public getFirstEffectByLabel(label: string): Effector | null {

        const filteredEffects: Effector[] = this.effects.filter(effect => effect.label === label);
        return filteredEffects.length !== 0 ? filteredEffects[0] : null;
    }

    public getEffectById(id: string): Effector[] {
        return this.effects.filter(effect => effect.id === id);
    }

    public getFirstEffectById(id: string): Effector | null {

        const filteredEffects: Effector[] = this.effects.filter(effect => effect.id === id);
        return filteredEffects.length !== 0 ? filteredEffects[0] : null;
    }

    public moveEffectToIndex(effect: Effector, index: number | ArrayPosition): void {

        let fromIndex: number = -1,
            matches: number = 0,
            i: number = 0;

        for (i = 0; i < this.effects.length; i++) {
            if (this.effects[i].id === effect.id) {
                if (fromIndex === -1)
                    fromIndex = i;

                matches++;
            }
        }

        if (matches === 0) throw new Error(
            "Effect '" + effect.id + "' (" + effect.label + ") could not be found. " +
            "The effect ID may have changed, or the effect is not attached to this channel."
        );

        if (matches > 1) throw new Error(
            "Multiple effects with the ID '" + effect.id + "' are attached to this channel. " +
            "Make sure every effect has a unique ID."
        );

        let toIndex: number;

        if (typeof index === "number") {
            toIndex = index;
        } else {
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

        if (fromIndex === toIndex) return;

        const item: Effector = this.effects.splice(fromIndex, 1)[0];

        if (fromIndex < toIndex)
            toIndex = toIndex - 1;

        this.effects.splice(toIndex, 0, item);

        // Initializing the effect is unnessecary because it should have been intialized already
        // otherwise it could not been found. Rebuilding the effect chain is nessecary though.
        this.rebuildEffectChainInternal();
    }
}
