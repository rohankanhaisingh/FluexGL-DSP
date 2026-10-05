import { v4 } from "uuid";

import { Channel } from "./Channel";
import { Debug } from "../../utilities/debugger";
import { Effector } from "./Effector";
import { AudioClipPlayer } from "./AudioClipPlayer";
import { AudioClip } from "./AudioClip";
import { ErrorCodes, WarningCodes } from "../../console-codes";

export class Master {

    public id: string = v4();

    public channels: Channel[] = [];
    public effects: Effector[] = [];

    public input: GainNode | null = null;
    public gainNode: GainNode | null = null;
    public analyserNode: AnalyserNode | null = null;
    public context: AudioContext | null = null;
    public audioClipPlayer: AudioClipPlayer | null = null;

    constructor(context: AudioContext) {

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

    private disconnectAudioNodes(): void {

        if (this.input) this.input.disconnect();
        if (this.gainNode) this.gainNode.disconnect();
        if (this.analyserNode) this.analyserNode.disconnect();

        this.effects.forEach(function (effect: Effector) {
            effect.outputNode?.disconnect();
        });
    }

    private rebuildEffectChain(): void {

        if (!this.context) return;
        if (!this.input || !this.gainNode || !this.analyserNode) return;

        this.disconnectAudioNodes();

        let currentNode: AudioNode = this.input;

        this.effects.forEach(function (effect: Effector) {

            if (!effect.inputNode || !effect.outputNode) return;

            currentNode.connect(effect.inputNode);
            currentNode = effect.outputNode;
        });

        currentNode.connect(this.gainNode);

        this.gainNode.connect(this.analyserNode);
        this.analyserNode.connect(this.context.destination);
    }

    public attachEffect(effect: Effector): void {

        if (this.effects.includes(effect)) return Debug.error("Could not attach the effect because it is already part of this master channel.", [
            "Call .detachEffect([effect Effector]) before attaching the effect."
        ], ErrorCodes.EFFECT_ALREADY_ATTACHED);

        if(!this.context) return this.rebuildEffectChain();

        this.effects.push(effect);
        effect.initializeOnAttachment(this.context);
        this.rebuildEffectChain();
    }

    public detachEffect(effect: Effector): void {

        if (!this.effects.includes(effect)) return Debug.error("Could not detach the effect because it is not part of this master channel.", [
            "Call .attachEffect([effect Effector]) before detaching the effect."
        ], ErrorCodes.EFFECT_NOT_FOUND);

        effect.outputNode?.disconnect();

        const self = this;

        this.effects.forEach(function (_effect: Effector, index: number) {
            if (effect.id === _effect.id) {
                self.effects.splice(index, 1);
                return;
            }
        });

        this.rebuildEffectChain();
    }

    public attachChannel(channel: Channel): void {

        if (this.channels.includes(channel)) return Debug.error("Could not attach the channel because it is already part of this master channel.", [
            "Call .detachChannel([channel Channel]) before attaching the channel."
        ], ErrorCodes.CHANNEL_ALREADY_ATTACHED);

        this.channels.push(channel);
        channel.masters.push(this);

        if (channel.output && this.input)
            channel.output.connect(this.input);

        return;
    }

    /**
     * Detaches the channel from this master channel. Detaching a channel that is not attached
     * only logs a warning, so it is safe to call at any time.
     *
     * @returns `true` when the channel has been detached, `false` when it was not attached.
     */
    public detachChannel(channel: Channel): boolean {

        const idx: number = this.channels.indexOf(channel);

        if (idx === -1) {
            Debug.warn("Could not detach the channel because it is not attached to this master channel.", [
                `Channel id: ${channel.id}.`,
                `Master channel id: ${this.id}.`
            ], WarningCodes.CHANNEL_NOT_ATTACHED);
            return false;
        }

        if (channel.output && this.input) {
            try {
                channel.output.disconnect(this.input);
            } catch {
                // The nodes were not connected (anymore), which is the desired end state anyway.
            }
        }

        this.channels.splice(idx, 1);

        const masterIdx: number = channel.masters.indexOf(this);

        if (masterIdx >= 0) channel.masters.splice(masterIdx, 1);

        return true;
    }

    /**
     * Detaches all channels from this master channel.
     */
    public detachAllChannels(): void {
        for (const channel of [...this.channels])
            this.detachChannel(channel);
    }

    public hasChannel(channel: Channel): boolean {
        return this.channels.includes(channel);
    }

    public hasAudioClipPlayer(): boolean {
        return !!this.audioClipPlayer;
    }

    public attachAudioClip(audioClip: AudioClip) {

        if (!this.audioClipPlayer) return Debug.error("Cannot not link AudioClip to this channel because this channel's AudioClipPlayer is undefined.");

        this.audioClipPlayer.attachAudioClip(audioClip);
    }
}
