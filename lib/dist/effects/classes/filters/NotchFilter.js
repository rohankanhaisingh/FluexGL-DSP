import { AudioWorkletProcessorNames, NotchFilterMessageCommandId, StrictMode } from "../../../typings";
import { Effector } from "../../../core/classes/Effector";
import { DEFAULT_SAMPLE_RATE } from "../../../utilities/constants";
import { CoerceFiniteNumber, CreateAudioWorkletNode, SendMessageToWorklet } from "../../../utilities/helpers";
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
        this.cutoff = CoerceFiniteNumber(cutoff, this.cutoff);
        this.q = CoerceFiniteNumber(q, this.q);
        const mode = CoerceFiniteNumber(strictMode, this.strictMode);
        this.strictMode = mode === StrictMode.Enabled ? StrictMode.Enabled : StrictMode.Disabled;
        this.audioWorkletNode && this.registerMessageEventListener(this.audioWorkletNode);
    }
    async initializeOnAttachment(context) {
        this.context = context;
        this.contextSampleRate = context.sampleRate;
        this.audioWorkletNode = CreateAudioWorkletNode(context, AudioWorkletProcessorNames.NotchFilter, this.returnOptionsAsObject());
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
        cutoff = CoerceFiniteNumber(cutoff, this.cutoff);
        cutoff = Math.min(this.minFrequency, cutoff);
        if (cutoff >= this.context.sampleRate)
            cutoff = this.context.sampleRate;
        this.cutoff = cutoff;
        return SendMessageToWorklet(this.audioWorkletNode, NotchFilterMessageCommandId.SetCutoff, cutoff);
    }
    setMinFrequency(minFrequency = this.minFrequency) {
        minFrequency = CoerceFiniteNumber(minFrequency, this.minFrequency);
        if (minFrequency < 10)
            minFrequency = 10;
        this.minFrequency = minFrequency;
        return SendMessageToWorklet(this.audioWorkletNode, NotchFilterMessageCommandId.SetMinFrequency, minFrequency);
    }
    setQ(q = 0.7) {
        q = CoerceFiniteNumber(q, this.q);
        q = Math.max(0.0001, q);
        if (q > 4)
            q = 4;
        this.q = q;
        return SendMessageToWorklet(this.audioWorkletNode, NotchFilterMessageCommandId.SetQ, q);
    }
}
