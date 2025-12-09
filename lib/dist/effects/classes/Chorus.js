import { SendMessageToWorklet, CreateAudioWorkletNode } from "../../utilities/helpers";
import { Effector } from "../../core/classes/Effector";
import { ChorusMessageCommandId, AudioWorkletProcessorNames } from "../../typings";
export class Chorus extends Effector {
    label = "Chorus";
    name = "Chorus";
    baseDelayMs = 15;
    depthMs = 8;
    rateHz = 1.5;
    mix = 0.5;
    feedback = 0.2;
    constructor({ baseDelayMs, depthMs, rateHz, mix, feedback }) {
        super();
        this.baseDelayMs = baseDelayMs ?? this.baseDelayMs;
        this.depthMs = depthMs ?? this.depthMs;
        this.rateHz = rateHz ?? this.rateHz;
        this.mix = mix ?? this.mix;
        this.feedback = feedback ?? this.feedback;
    }
    async InitializeOnAttachment(parentialContext) {
        this.parentialContext = parentialContext;
        this.audioWorkletNode = CreateAudioWorkletNode(parentialContext, AudioWorkletProcessorNames.Chorus, this.ReturnOptionsAsObject());
    }
    ReturnOptionsAsObject() {
        return {
            baseDelayMs: this.baseDelayMs,
            depthMs: this.depthMs,
            rateHz: this.rateHz,
            mix: this.mix,
            feedback: this.feedback,
        };
    }
    SetBaseDelayMs(value) {
        this.baseDelayMs = value;
        return SendMessageToWorklet(this.audioWorkletNode, ChorusMessageCommandId.SetBaseDelayMs, value);
    }
    SetDepthMs(value) {
        this.depthMs = value;
        return SendMessageToWorklet(this.audioWorkletNode, ChorusMessageCommandId.SetDepthMs, value);
    }
    SetRateHz(value) {
        this.rateHz = value;
        return SendMessageToWorklet(this.audioWorkletNode, ChorusMessageCommandId.SetRateHz, value);
    }
    SetMix(value) {
        this.mix = value;
        return SendMessageToWorklet(this.audioWorkletNode, ChorusMessageCommandId.SetMix, value);
    }
    SetFeedback(value) {
        this.feedback = value;
        return SendMessageToWorklet(this.audioWorkletNode, ChorusMessageCommandId.SetFeedback, value);
    }
}
