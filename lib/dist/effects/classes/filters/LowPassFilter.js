import { Effector } from "../../../core/classes/Effector";
import { coerceFiniteNumber, sendMessageToWorklet, createAudioWorkletNode } from "../../../utilities/helpers";
import { LowPassFilterMessageCommandId, AudioWorkletProcessorNames, StrictMode } from "../../../typings";
export class LowPassFilter extends Effector {
    name = "LowPassFilter";
    label = "LowPassFilter";
    cutoff = 1000;
    q = 0.7;
    minFrequency = 10;
    strictMode = StrictMode.Disabled;
    constructor({ cutoff, minFrequency, q, strictMode }) {
        super();
        this.cutoff = coerceFiniteNumber(cutoff, this.cutoff);
        this.minFrequency = coerceFiniteNumber(minFrequency, this.minFrequency);
        this.q = coerceFiniteNumber(q, this.q);
        const mode = coerceFiniteNumber(strictMode, this.strictMode);
        this.strictMode = mode === StrictMode.Enabled ? StrictMode.Enabled : StrictMode.Disabled;
    }
    async initializeOnAttachment(context) {
        this.context = context;
        this.audioWorkletNode = createAudioWorkletNode(context, AudioWorkletProcessorNames.LowPassFilter, this.returnOptionsAsObject());
        this.audioWorkletNode && this.registerMessageEventListener(this.audioWorkletNode);
    }
    returnOptionsAsObject() {
        return {
            cutoff: this.cutoff,
            minFrequency: this.minFrequency,
            q: this.q,
            strictMode: this.strictMode
        };
    }
    setCutoff(cutoff = 1000) {
        if (!this.context)
            return false;
        cutoff = coerceFiniteNumber(cutoff, this.cutoff);
        cutoff = Math.max(this.minFrequency, cutoff);
        if (cutoff >= this.context.sampleRate)
            cutoff = this.context.sampleRate;
        this.cutoff = cutoff;
        return sendMessageToWorklet(this.audioWorkletNode, LowPassFilterMessageCommandId.SetCutoff, cutoff);
    }
    setMinFrequency(minFrequency = 10) {
        minFrequency = coerceFiniteNumber(minFrequency, this.minFrequency);
        if (minFrequency < 10)
            minFrequency = 10;
        this.minFrequency = minFrequency;
        return sendMessageToWorklet(this.audioWorkletNode, LowPassFilterMessageCommandId.SetMinFrequency, minFrequency);
    }
    setQ(q = 0.7) {
        q = coerceFiniteNumber(q, this.q);
        q = Math.max(0.0001, q);
        if (q > 4)
            q = 4;
        this.q = q;
        return sendMessageToWorklet(this.audioWorkletNode, LowPassFilterMessageCommandId.SetQ, q);
    }
}
