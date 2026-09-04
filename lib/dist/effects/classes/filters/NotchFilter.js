import { AudioWorkletProcessorNames, NotchFilterMessageCommandId, StrictMode } from "../../../typings";
import { Effector } from "../../../core/classes/Effector";
import { DEFAULT_SAMPLE_RATE } from "../../../utilities/constants";
import { coerceFiniteNumber, createAudioWorkletNode, sendMessageToWorklet } from "../../../utilities/helpers";
export default class NotchFilter extends Effector {
    name = "NotchFilter";
    label = "NotchFilter";
    cutoff = 1000;
    minFrequency = 10;
    q = 0.7;
    contextSampleRate = DEFAULT_SAMPLE_RATE;
    strictMode = StrictMode.Disabled;
    constructor({ cutoff, q, minFrequency, strictMode } = {}) {
        super();
        this.cutoff = coerceFiniteNumber(cutoff, this.cutoff);
        this.q = coerceFiniteNumber(q, this.q);
        const mode = coerceFiniteNumber(strictMode, this.strictMode);
        this.strictMode = mode === StrictMode.Enabled ? StrictMode.Enabled : StrictMode.Disabled;
        this.audioWorkletNode && this.registerMessageEventListener(this.audioWorkletNode);
    }
    async initializeOnAttachment(context) {
        this.context = context;
        this.contextSampleRate = context.sampleRate;
        this.audioWorkletNode = createAudioWorkletNode(context, AudioWorkletProcessorNames.NotchFilter, this.returnOptionsAsObject());
    }
    returnOptionsAsObject() {
        return {
            cutoff: this.cutoff,
            q: this.q,
            strictMode: this.strictMode,
            minFrequency: this.minFrequency
        };
    }
    setCutoff(cutoff = 1000) {
        if (!this.context)
            return false;
        cutoff = coerceFiniteNumber(cutoff, this.cutoff);
        cutoff = Math.min(this.minFrequency, cutoff);
        if (cutoff >= this.context.sampleRate)
            cutoff = this.context.sampleRate;
        this.cutoff = cutoff;
        return sendMessageToWorklet(this.audioWorkletNode, NotchFilterMessageCommandId.SetCutoff, cutoff);
    }
    setMinFrequency(minFrequency = this.minFrequency) {
        minFrequency = coerceFiniteNumber(minFrequency, this.minFrequency);
        if (minFrequency < 10)
            minFrequency = 10;
        this.minFrequency = minFrequency;
        return sendMessageToWorklet(this.audioWorkletNode, NotchFilterMessageCommandId.SetMinFrequency, minFrequency);
    }
    setQ(q = 0.7) {
        q = coerceFiniteNumber(q, this.q);
        q = Math.max(0.0001, q);
        if (q > 4)
            q = 4;
        this.q = q;
        return sendMessageToWorklet(this.audioWorkletNode, NotchFilterMessageCommandId.SetQ, q);
    }
}
