import { Effector } from "../../../core/classes/Effector";

import { SendMessageToWorklet, CreateAudioWorkletNode } from "../../../utilities/helpers";

import { LowPassFilterOptions, LowPassFilterMessageCommandId, AudioWorkletProcessorNames } from "../../../typings";

export class LowPassFilter extends Effector {

    public name: string = "LowPassFilter";
    public label: string | null = "LowPassFilter";

    public cutoff: number = 1000;
    public q: number = 0.7;
    public minFrequency: number = 10;

    constructor({ cutoff, minFrequency, q }: Partial<LowPassFilterOptions>) {
        super();

        this.cutoff = cutoff ?? this.cutoff;
        this.minFrequency = minFrequency ?? this.minFrequency;
        this.q = q ?? this.q;
    }

    public async InitializeOnAttachment(parentialContext: AudioContext): Promise<void> {

        this.parentialContext = parentialContext;
        this.audioWorkletNode = CreateAudioWorkletNode(parentialContext, AudioWorkletProcessorNames.LowPassFilter, this.ReturnOptionsAsObject());
    }

    public ReturnOptionsAsObject(): LowPassFilterOptions {
        return {
            cutoff: this.cutoff,
            minFrequency: this.minFrequency,
            q: this.q
        }
    }

    public SetCutoff(cutoff: number = 1000): boolean {

        if (!this.parentialContext) return false;

        if (cutoff >= this.parentialContext.sampleRate)
            cutoff = this.parentialContext.sampleRate;

        this.cutoff = cutoff;
        return SendMessageToWorklet<LowPassFilterMessageCommandId, number>(this.audioWorkletNode, LowPassFilterMessageCommandId.SetCutoff, cutoff);
    }

    public SetMinFrequency(minFrequency: number = 10): boolean {

        if (minFrequency < 10)
            minFrequency = 10;

        this.minFrequency = minFrequency;
        return SendMessageToWorklet<LowPassFilterMessageCommandId, number>(this.audioWorkletNode, LowPassFilterMessageCommandId.SetMinFrequency, minFrequency);
    }

    public SetQ(q: number = 0.7): boolean {

        if(q > 4) 
            q = 4;

        this.q = q;
        return SendMessageToWorklet<LowPassFilterMessageCommandId, number>(this.audioWorkletNode, LowPassFilterMessageCommandId.SetQ, q);
    }
}