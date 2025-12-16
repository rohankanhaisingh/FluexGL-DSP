import { v4 } from "uuid";

import { Channel } from "./Channel";
import { Debug } from "../../utilities/debugger";
import { Effector } from "./Effector";

export class Master {

    public id: string = v4();

    public channels: Channel[] = [];
    public effects: Effector[] = [];

    public inputNode: GainNode | null = null;
    public gainNode: GainNode | null = null;
    public analyserNode: AnalyserNode | null = null;
    public context: AudioContext | null = null;

    constructor(context: AudioContext) {

        this.context = context;

        this.inputNode = new GainNode(context);
        this.gainNode = new GainNode(context);
        this.analyserNode = new AnalyserNode(context);

        this.inputNode.connect(this.gainNode);
        this.gainNode.connect(this.analyserNode);
        this.analyserNode.connect(this.context.destination);
    }

    private disconnectAudioNodes(): void {

        if (this.inputNode) this.inputNode.disconnect();
        if (this.gainNode) this.gainNode.disconnect();
        if (this.analyserNode) this.analyserNode.disconnect();

        this.effects.forEach(function (effect: Effector) {
            if (effect.audioWorkletNode)
                effect.audioWorkletNode.disconnect();
        });
    }

    private rebuildEffectChain(): void {

        if (!this.context) return;
        if (!this.inputNode || !this.gainNode || !this.analyserNode) return;

        this.disconnectAudioNodes();

        let currentNode: AudioNode = this.inputNode;

        this.effects.forEach(function (effect: Effector) {

            if (!effect.audioWorkletNode) return;

            currentNode.connect(effect.audioWorkletNode);
            currentNode = effect.audioWorkletNode;
        });

        currentNode.connect(this.gainNode);

        this.gainNode.connect(this.analyserNode);
        this.analyserNode.connect(this.context.destination);
    }

    public AttachEffect(effect: Effector): void {

        if (this.effects.includes(effect)) return Debug.Error("Could not attach the effect because it is already part of this master channel.", [
            "Call .DetachEffect([effect Effector]) before attaching the effect."
        ]);

        this.effects.push(effect);
        this.rebuildEffectChain();
    }

    public DetachEffect(effect: Effector): void {

        if (!this.effects.includes(effect)) return Debug.Error("Could not detach the effect because it is not part of this master channel.", [
            "Call .AttachEffect([effect Effector]) before detaching the effect."
        ]);

        const self = this;

        this.effects.forEach(function (_effect: Effector, index: number) {

            if (effect.id === _effect.id) {
                self.effects.splice(index, 1);
                return;
            }
        });

        this.rebuildEffectChain();
    }

    public AttachChannel(channel: Channel): void {

        if (this.channels.includes(channel)) return Debug.Error("Could not attach the channel because it is already part of this master channel.", [
            "Call .DetachChannel([channel Channel]) before attaching the channel."
        ]);

        this.channels.push(channel);

        if (channel.output && this.inputNode)
            channel.output.connect(this.inputNode);

        return;
    }

    public DetachChannel(channel: Channel): void {

        if (!this.channels.includes(channel)) return Debug.Error("Could not detach the channel because it is not part of this master channel.", [
            "Call .AttachChannel([channel Channel]) before detaching the channel."
        ]);

        if (channel.output && this.inputNode)
            channel.output.disconnect(this.inputNode);

        const self = this;

        this.channels.forEach(function (_channel: Channel, index: number) {
            if (channel.id !== _channel.id) return;
            
            self.channels.splice(index, 1);
        });
    }
}
