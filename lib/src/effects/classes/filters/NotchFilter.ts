import { AudioWorkletProcessorNames, NotchFilterMessageCommandId, NotchFilterOptions, StrictMode } from "../../../typings";
import { Effector } from "../../../core/classes/Effector";
import { DEFAULT_SAMPLE_RATE } from "../../../utilities/constants";
import { CoerceFiniteNumber, CreateAudioWorkletNode, SendMessageToWorklet } from "../../../utilities/helpers";

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

        this.cutoff = CoerceFiniteNumber(cutoff, this.cutoff);
        this.q = CoerceFiniteNumber(q, this.q);

        const mode = CoerceFiniteNumber(strictMode, this.strictMode);
        this.strictMode = mode === StrictMode.Enabled ? StrictMode.Enabled : StrictMode.Disabled;
        this.audioWorkletNode && this.registerMessageEventListener(this.audioWorkletNode);
    }

    public async InitializeOnAttachment(context: AudioContext): Promise<void> {

        this.context = context;
        this.contextSampleRate = context.sampleRate;
        this.audioWorkletNode = CreateAudioWorkletNode(context, AudioWorkletProcessorNames.NotchFilter, this.ReturnOptionsAsObject());
    }

    public ReturnOptionsAsObject(): NotchFilterOptions {
        return {
            cutoff: this.cutoff,
            q: this.q,
            strictMode: this.strictMode,
            minFrequency: this.minFrequency
        }
    }

    public SetCutoff(cutoff: number = 1000): boolean {

        if (!this.context) return false;

        cutoff = CoerceFiniteNumber(cutoff, this.cutoff);
        cutoff = Math.min(this.minFrequency, cutoff);

        if (cutoff >= this.context.sampleRate)
            cutoff = this.context.sampleRate;

        this.cutoff = cutoff;
        return SendMessageToWorklet<NotchFilterMessageCommandId, number>(this.audioWorkletNode, NotchFilterMessageCommandId.SetCutoff, cutoff);
    }

    public SetMinFrequency(minFrequency: number = this.minFrequency) {

        minFrequency = CoerceFiniteNumber(minFrequency, this.minFrequency);

        if(minFrequency < 10) 
            minFrequency = 10;

        this.minFrequency = minFrequency;
        return SendMessageToWorklet<NotchFilterMessageCommandId.SetMinFrequency, number>(this.audioWorkletNode, NotchFilterMessageCommandId.SetMinFrequency, minFrequency);
    }

    public SetQ(q: number = 0.7): boolean {

        q = CoerceFiniteNumber(q, this.q);
        q = Math.max(0.0001, q);

        if (q > 4)
            q = 4;

        this.q = q;
        return SendMessageToWorklet<NotchFilterMessageCommandId, number>(this.audioWorkletNode, NotchFilterMessageCommandId.SetQ, q);
    }
}
