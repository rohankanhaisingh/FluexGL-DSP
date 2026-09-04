import { AudioWorkletProcessorNames, NotchFilterMessageCommandId, NotchFilterOptions, StrictMode } from "../../../typings";
import { Effector } from "../../../core/classes/Effector";
import { DEFAULT_SAMPLE_RATE } from "../../../utilities/constants";
import { coerceFiniteNumber, createAudioWorkletNode, sendMessageToWorklet } from "../../../utilities/helpers";

export default class NotchFilter extends Effector {

    public name: string = "NotchFilter";
    public label: string | null = "NotchFilter";

    public cutoff: number = 1000;
    public minFrequency: number = 10;
    public q: number = 0.7;

    private contextSampleRate: number = DEFAULT_SAMPLE_RATE;
    private strictMode: StrictMode = StrictMode.Disabled;

    constructor({ cutoff, q, minFrequency, strictMode }: Partial<NotchFilterOptions> = {}) {
        super();

        this.cutoff = coerceFiniteNumber(cutoff, this.cutoff);
        this.q = coerceFiniteNumber(q, this.q);

        const mode = coerceFiniteNumber(strictMode, this.strictMode);
        this.strictMode = mode === StrictMode.Enabled ? StrictMode.Enabled : StrictMode.Disabled;
        this.audioWorkletNode && this.registerMessageEventListener(this.audioWorkletNode);
    }

    public async initializeOnAttachment(context: AudioContext): Promise<void> {

        this.context = context;
        this.contextSampleRate = context.sampleRate;
        this.audioWorkletNode = createAudioWorkletNode(context, AudioWorkletProcessorNames.NotchFilter, this.returnOptionsAsObject());
    }

    public returnOptionsAsObject(): NotchFilterOptions {
        return {
            cutoff: this.cutoff,
            q: this.q,
            strictMode: this.strictMode,
            minFrequency: this.minFrequency
        }
    }

    public setCutoff(cutoff: number = 1000): boolean {

        if (!this.context) return false;

        cutoff = coerceFiniteNumber(cutoff, this.cutoff);
        cutoff = Math.min(this.minFrequency, cutoff);

        if (cutoff >= this.context.sampleRate)
            cutoff = this.context.sampleRate;

        this.cutoff = cutoff;
        return sendMessageToWorklet<NotchFilterMessageCommandId, number>(this.audioWorkletNode, NotchFilterMessageCommandId.SetCutoff, cutoff);
    }

    public setMinFrequency(minFrequency: number = this.minFrequency) {

        minFrequency = coerceFiniteNumber(minFrequency, this.minFrequency);

        if(minFrequency < 10) 
            minFrequency = 10;

        this.minFrequency = minFrequency;
        return sendMessageToWorklet<NotchFilterMessageCommandId.SetMinFrequency, number>(this.audioWorkletNode, NotchFilterMessageCommandId.SetMinFrequency, minFrequency);
    }

    public setQ(q: number = 0.7): boolean {

        q = coerceFiniteNumber(q, this.q);
        q = Math.max(0.0001, q);

        if (q > 4)
            q = 4;

        this.q = q;
        return sendMessageToWorklet<NotchFilterMessageCommandId, number>(this.audioWorkletNode, NotchFilterMessageCommandId.SetQ, q);
    }
}
