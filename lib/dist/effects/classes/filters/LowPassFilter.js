import { Effector } from "../../../core/classes/Effector";
import { CoerceFiniteNumber, SendMessageToWorklet, CreateAudioWorkletNode } from "../../../utilities/helpers";
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
        this.cutoff = CoerceFiniteNumber(cutoff, this.cutoff);
        this.minFrequency = CoerceFiniteNumber(minFrequency, this.minFrequency);
        this.q = CoerceFiniteNumber(q, this.q);
        const mode = CoerceFiniteNumber(strictMode, this.strictMode);
        this.strictMode = mode === StrictMode.Enabled ? StrictMode.Enabled : StrictMode.Disabled;
    }
    async InitializeOnAttachment(context) {
        this.context = context;
        this.audioWorkletNode = CreateAudioWorkletNode(context, AudioWorkletProcessorNames.LowPassFilter, this.ReturnOptionsAsObject());
        this.audioWorkletNode && this.registerMessageEventListener(this.audioWorkletNode);
    }
    ReturnOptionsAsObject() {
        return {
            cutoff: this.cutoff,
            minFrequency: this.minFrequency,
            q: this.q,
            strictMode: this.strictMode
        };
    }
    SetCutoff(cutoff = 1000) {
        if (!this.context)
            return false;
        cutoff = CoerceFiniteNumber(cutoff, this.cutoff);
        cutoff = Math.max(this.minFrequency, cutoff);
        if (cutoff >= this.context.sampleRate)
            cutoff = this.context.sampleRate;
        this.cutoff = cutoff;
        return SendMessageToWorklet(this.audioWorkletNode, LowPassFilterMessageCommandId.SetCutoff, cutoff);
    }
    SetMinFrequency(minFrequency = 10) {
        minFrequency = CoerceFiniteNumber(minFrequency, this.minFrequency);
        if (minFrequency < 10)
            minFrequency = 10;
        this.minFrequency = minFrequency;
        return SendMessageToWorklet(this.audioWorkletNode, LowPassFilterMessageCommandId.SetMinFrequency, minFrequency);
    }
    SetQ(q = 0.7) {
        q = CoerceFiniteNumber(q, this.q);
        q = Math.max(0.0001, q);
        if (q > 4)
            q = 4;
        this.q = q;
        return SendMessageToWorklet(this.audioWorkletNode, LowPassFilterMessageCommandId.SetQ, q);
    }
}
