import { CoerceFiniteNumber, CreateAudioWorkletNode, SendMessageToWorklet } from "../../../utilities/helpers";
import { Effector } from "../../../core/classes/Effector";
import { AudioWorkletProcessorNames, HighPassFilterMessageCommandId, HighPassFilterOptions, StrictMode } from "../../../typings";
import { DEFAULT_SAMPLE_RATE } from "../../../utilities/constants";

export class HighPassFilter extends Effector {

    public name: string = "HighPassFilter";
    public label: string | null = "HighPassFilter";

    public cutoff: number = 1000;
    public q: number = 0.7;
    public strictMode: StrictMode = StrictMode.Disabled;
    public maxFrequency: number = DEFAULT_SAMPLE_RATE * 0.5;

    private contextSampleRate: number = DEFAULT_SAMPLE_RATE;

    constructor({ cutoff, q, strictMode }: Partial<HighPassFilterOptions> = {}) {
        super();

        this.cutoff = CoerceFiniteNumber(cutoff, this.cutoff);
        this.q = CoerceFiniteNumber(q, this.q);

        const mode = CoerceFiniteNumber(strictMode, this.strictMode);
        this.strictMode = mode === StrictMode.Enabled ? StrictMode.Enabled : StrictMode.Disabled;
        this.audioWorkletNode && this.registerMessageEventListener(this.audioWorkletNode);
    }

    public async initializeOnAttachment(context: AudioContext): Promise<void> {

        this.context = context;
        this.contextSampleRate = context.sampleRate;
        this.audioWorkletNode = CreateAudioWorkletNode(context, AudioWorkletProcessorNames.HighPassFilter, this.returnOptionsAsObject());
    }

    public returnOptionsAsObject(): HighPassFilterOptions {
        return {
            cutoff: this.cutoff,
            q: this.q,
            strictMode: this.strictMode,
            maxFrequency: this.maxFrequency
        }
    }

    public setCutoff(cutoff: number = 1000): boolean {

        if (!this.context) return false;

        cutoff = CoerceFiniteNumber(cutoff, this.cutoff);
        cutoff = Math.min(this.maxFrequency, cutoff);

        if (cutoff >= this.context.sampleRate)
            cutoff = this.context.sampleRate;

        this.cutoff = cutoff;
        return SendMessageToWorklet<HighPassFilterMessageCommandId, number>(this.audioWorkletNode, HighPassFilterMessageCommandId.SetCutoff, cutoff);
    }
    
    public setMaxFrequency(maxFrequency: number = this.maxFrequency) {

        maxFrequency = CoerceFiniteNumber(maxFrequency, this.maxFrequency);

        if(maxFrequency > (this.contextSampleRate * 0.5))
            throw new Error("Could not set the max frequency, because the value is over the sample rate.");

        this.maxFrequency = maxFrequency;
        return SendMessageToWorklet<HighPassFilterMessageCommandId.SetMaxFrequency, number>(this.audioWorkletNode, HighPassFilterMessageCommandId.SetMaxFrequency, maxFrequency);
    }

    public setQ(q: number = 0.7): boolean {

        q = CoerceFiniteNumber(q, this.q);
        q = Math.max(0.0001, q);

        if (q > 4)
            q = 4;

        this.q = q;
        return SendMessageToWorklet<HighPassFilterMessageCommandId, number>(this.audioWorkletNode, HighPassFilterMessageCommandId.SetQ, q);
    }
}