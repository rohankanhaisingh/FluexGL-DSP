import { Effector } from "../../../core/classes/Effector";
import { SendMessageToWorklet, CreateAudioWorkletNode } from "../../../utilities/helpers";
import { LowPassFilterMessageCommandId, AudioWorkletProcessorNames } from "../../../typings";
export class LowPassFilter extends Effector {
    name = "LowPassFilter";
    label = "LowPassFilter";
    cutoff = 1000;
    q = 0.7;
    minFrequency = 10;
    constructor({ cutoff, minFrequency, q }) {
        super();
        this.cutoff = cutoff ?? this.cutoff;
        this.minFrequency = minFrequency ?? this.minFrequency;
        this.q = q ?? this.q;
    }
    async InitializeOnAttachment(parentialContext) {
        this.parentialContext = parentialContext;
        this.audioWorkletNode = CreateAudioWorkletNode(parentialContext, AudioWorkletProcessorNames.LowPassFilter, this.ReturnOptionsAsObject());
        this.registerMessageEventListener(this.audioWorkletNode);
    }
    ReturnOptionsAsObject() {
        return {
            cutoff: this.cutoff,
            minFrequency: this.minFrequency,
            q: this.q
        };
    }
    SetCutoff(cutoff = 1000) {
        if (!this.parentialContext)
            return false;
        if (cutoff >= this.parentialContext.sampleRate)
            cutoff = this.parentialContext.sampleRate;
        this.cutoff = cutoff;
        return SendMessageToWorklet(this.audioWorkletNode, LowPassFilterMessageCommandId.SetCutoff, cutoff);
    }
    SetMinFrequency(minFrequency = 10) {
        if (minFrequency < 10)
            minFrequency = 10;
        this.minFrequency = minFrequency;
        return SendMessageToWorklet(this.audioWorkletNode, LowPassFilterMessageCommandId.SetMinFrequency, minFrequency);
    }
    SetQ(q = 0.7) {
        if (q > 4)
            q = 4;
        this.q = q;
        return SendMessageToWorklet(this.audioWorkletNode, LowPassFilterMessageCommandId.SetQ, q);
    }
}
