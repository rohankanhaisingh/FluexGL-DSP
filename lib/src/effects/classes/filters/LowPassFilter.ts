import { Effector } from "../../../core/classes/Effector";

import { coerceFiniteNumber, sendMessageToWorklet, createAudioWorkletNode } from "../../../utilities/helpers";

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

        this.cutoff = coerceFiniteNumber(cutoff, this.cutoff);
        this.minFrequency = coerceFiniteNumber(minFrequency, this.minFrequency);
        this.q = coerceFiniteNumber(q, this.q);

        const mode = coerceFiniteNumber(strictMode, this.strictMode);
        this.strictMode = mode === StrictMode.Enabled ? StrictMode.Enabled : StrictMode.Disabled;
    }

    public async initializeOnAttachment(context: AudioContext): Promise<void> {

        this.context = context;
        this.audioWorkletNode = createAudioWorkletNode(context, AudioWorkletProcessorNames.LowPassFilter, this.returnOptionsAsObject());
        this.audioWorkletNode && this.registerMessageEventListener(this.audioWorkletNode);
    }

    public returnOptionsAsObject(): LowPassFilterOptions {
        return {
            cutoff: this.cutoff,
            minFrequency: this.minFrequency,
            q: this.q,
            strictMode: this.strictMode
        }
    }

    public setCutoff(cutoff: number = 1000): boolean {

        if (!this.context) return false;

        cutoff = coerceFiniteNumber(cutoff, this.cutoff);
        cutoff = Math.max(this.minFrequency, cutoff);

        if (cutoff >= this.context.sampleRate)
            cutoff = this.context.sampleRate;

        this.cutoff = cutoff;
        return sendMessageToWorklet<LowPassFilterMessageCommandId, number>(this.audioWorkletNode, LowPassFilterMessageCommandId.SetCutoff, cutoff);
    }

    public setMinFrequency(minFrequency: number = 10): boolean {

        minFrequency = coerceFiniteNumber(minFrequency, this.minFrequency);

        if (minFrequency < 10)
            minFrequency = 10;

        this.minFrequency = minFrequency;
        return sendMessageToWorklet<LowPassFilterMessageCommandId, number>(this.audioWorkletNode, LowPassFilterMessageCommandId.SetMinFrequency, minFrequency);
    }

    public setQ(q: number = 0.7): boolean {

        q = coerceFiniteNumber(q, this.q);
        q = Math.max(0.0001, q);

        if(q > 4) 
            q = 4;

        this.q = q;
        return sendMessageToWorklet<LowPassFilterMessageCommandId, number>(this.audioWorkletNode, LowPassFilterMessageCommandId.SetQ, q);
    }
}
