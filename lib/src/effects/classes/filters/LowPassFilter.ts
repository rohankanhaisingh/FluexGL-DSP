import { Effector } from "../../../core/classes/Effector";

import { CoerceFiniteNumber, SendMessageToWorklet, CreateAudioWorkletNode } from "../../../utilities/helpers";

import { LowPassFilterOptions, LowPassFilterMessageCommandId, AudioWorkletProcessorNames, StrictMode } from "../../../typings";

export class LowPassFilter extends Effector {

    public name: string = "LowPassFilter";
    public label: string | null = "LowPassFilter";

    public cutoff: number = 1000;
    public q: number = 0.7;
    public minFrequency: number = 10;
    public strictMode: StrictMode = StrictMode.Disabled;

    constructor({ cutoff, minFrequency, q, strictMode }: Partial<LowPassFilterOptions>) {
        super();

        this.cutoff = CoerceFiniteNumber(cutoff, this.cutoff);
        this.minFrequency = CoerceFiniteNumber(minFrequency, this.minFrequency);
        this.q = CoerceFiniteNumber(q, this.q);

        const mode = CoerceFiniteNumber(strictMode, this.strictMode);
        this.strictMode = mode === StrictMode.Enabled ? StrictMode.Enabled : StrictMode.Disabled;
    }

    public async InitializeOnAttachment(context: AudioContext): Promise<void> {

        this.context = context;
        this.audioWorkletNode = CreateAudioWorkletNode(context, AudioWorkletProcessorNames.LowPassFilter, this.ReturnOptionsAsObject());
        this.audioWorkletNode && this.registerMessageEventListener(this.audioWorkletNode);
    }

    public ReturnOptionsAsObject(): LowPassFilterOptions {
        return {
            cutoff: this.cutoff,
            minFrequency: this.minFrequency,
            q: this.q,
            strictMode: this.strictMode
        }
    }

    public SetCutoff(cutoff: number = 1000): boolean {

        if (!this.context) return false;

        cutoff = CoerceFiniteNumber(cutoff, this.cutoff);
        cutoff = Math.max(this.minFrequency, cutoff);

        if (cutoff >= this.context.sampleRate)
            cutoff = this.context.sampleRate;

        this.cutoff = cutoff;
        return SendMessageToWorklet<LowPassFilterMessageCommandId, number>(this.audioWorkletNode, LowPassFilterMessageCommandId.SetCutoff, cutoff);
    }

    public SetMinFrequency(minFrequency: number = 10): boolean {

        minFrequency = CoerceFiniteNumber(minFrequency, this.minFrequency);

        if (minFrequency < 10)
            minFrequency = 10;

        this.minFrequency = minFrequency;
        return SendMessageToWorklet<LowPassFilterMessageCommandId, number>(this.audioWorkletNode, LowPassFilterMessageCommandId.SetMinFrequency, minFrequency);
    }

    public SetQ(q: number = 0.7): boolean {

        q = CoerceFiniteNumber(q, this.q);
        q = Math.max(0.0001, q);

        if(q > 4) 
            q = 4;

        this.q = q;
        return SendMessageToWorklet<LowPassFilterMessageCommandId, number>(this.audioWorkletNode, LowPassFilterMessageCommandId.SetQ, q);
    }
}
