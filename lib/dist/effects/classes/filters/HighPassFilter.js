import { CoerceFiniteNumber, CreateAudioWorkletNode, SendMessageToWorklet } from "../../../utilities/helpers";
import { Effector } from "../../../core/classes/Effector";
import { AudioWorkletProcessorNames, HighPassFilterMessageCommandId, StrictMode } from "../../../typings";
import { DEFAULT_SAMPLE_RATE } from "../../../utilities/constants";
export class HighPassFilter extends Effector {
    name = "HighPassFilter";
    label = "HighPassFilter";
    cutoff = 1000;
    q = 0.7;
    strictMode = StrictMode.Disabled;
    maxFrequency = DEFAULT_SAMPLE_RATE * 0.5;
    contextSampleRate = DEFAULT_SAMPLE_RATE;
    constructor({ cutoff, q, strictMode } = {}) {
        super();
        this.cutoff = CoerceFiniteNumber(cutoff, this.cutoff);
        this.q = CoerceFiniteNumber(q, this.q);
        const mode = CoerceFiniteNumber(strictMode, this.strictMode);
        this.strictMode = mode === StrictMode.Enabled ? StrictMode.Enabled : StrictMode.Disabled;
        this.audioWorkletNode && this.registerMessageEventListener(this.audioWorkletNode);
    }
    async InitializeOnAttachment(context) {
        this.context = context;
        this.contextSampleRate = context.sampleRate;
        this.audioWorkletNode = CreateAudioWorkletNode(context, AudioWorkletProcessorNames.HighPassFilter, this.ReturnOptionsAsObject());
    }
    ReturnOptionsAsObject() {
        return {
            cutoff: this.cutoff,
            q: this.q,
            strictMode: this.strictMode,
            maxFrequency: this.maxFrequency
        };
    }
    SetCutoff(cutoff = 1000) {
        if (!this.context)
            return false;
        cutoff = CoerceFiniteNumber(cutoff, this.cutoff);
        cutoff = Math.min(this.maxFrequency, cutoff);
        if (cutoff >= this.context.sampleRate)
            cutoff = this.context.sampleRate;
        this.cutoff = cutoff;
        return SendMessageToWorklet(this.audioWorkletNode, HighPassFilterMessageCommandId.SetCutoff, cutoff);
    }
    SetMaxFrequency(maxFrequency = this.maxFrequency) {
        maxFrequency = CoerceFiniteNumber(maxFrequency, this.maxFrequency);
        if (maxFrequency > (this.contextSampleRate * 0.5))
            throw new Error("Could not set the max frequency, because the value is over the sample rate.");
        this.maxFrequency = maxFrequency;
        return SendMessageToWorklet(this.audioWorkletNode, HighPassFilterMessageCommandId.SetMaxFrequency, maxFrequency);
    }
    SetQ(q = 0.7) {
        q = CoerceFiniteNumber(q, this.q);
        q = Math.max(0.0001, q);
        if (q > 4)
            q = 4;
        this.q = q;
        return SendMessageToWorklet(this.audioWorkletNode, HighPassFilterMessageCommandId.SetQ, q);
    }
}
