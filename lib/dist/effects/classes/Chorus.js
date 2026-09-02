import { CoerceFiniteNumber, SendMessageToWorklet, CreateAudioWorkletNode } from "../../utilities/helpers";
import { Effector } from "../../core/classes/Effector";
import { ChorusMessageCommandId, AudioWorkletProcessorNames, StrictMode } from "../../typings";
export class Chorus extends Effector {
    label = "Chorus";
    name = "Chorus";
    baseDelayMs = 15;
    depthMs = 8;
    rateHz = 1.5;
    mix = 0.5;
    feedback = 0.2;
    strictMode = StrictMode.Disabled;
    constructor({ baseDelayMs, depthMs, rateHz, mix, feedback, strictMode }) {
        super();
        this.baseDelayMs = Math.max(0, CoerceFiniteNumber(baseDelayMs, this.baseDelayMs));
        this.depthMs = Math.max(0, CoerceFiniteNumber(depthMs, this.depthMs));
        this.rateHz = Math.max(0, CoerceFiniteNumber(rateHz, this.rateHz));
        this.mix = Math.max(0, Math.min(1, CoerceFiniteNumber(mix, this.mix)));
        this.feedback = Math.max(0, Math.min(1, CoerceFiniteNumber(feedback, this.feedback)));
        const mode = CoerceFiniteNumber(strictMode, this.strictMode);
        this.strictMode = mode === StrictMode.Enabled ? StrictMode.Enabled : StrictMode.Disabled;
    }
    async initializeOnAttachment(context) {
        this.context = context;
        this.audioWorkletNode = CreateAudioWorkletNode(context, AudioWorkletProcessorNames.Chorus, this.returnOptionsAsObject());
    }
    returnOptionsAsObject() {
        return {
            baseDelayMs: this.baseDelayMs,
            depthMs: this.depthMs,
            rateHz: this.rateHz,
            mix: this.mix,
            feedback: this.feedback,
            strictMode: this.strictMode
        };
    }
    setBaseDelayMs(value) {
        value = Math.max(0, CoerceFiniteNumber(value, this.baseDelayMs));
        this.baseDelayMs = value;
        return SendMessageToWorklet(this.audioWorkletNode, ChorusMessageCommandId.SetBaseDelayMs, value);
    }
    setDepthMs(value) {
        value = Math.max(0, CoerceFiniteNumber(value, this.depthMs));
        this.depthMs = value;
        return SendMessageToWorklet(this.audioWorkletNode, ChorusMessageCommandId.SetDepthMs, value);
    }
    setRateHz(value) {
        value = Math.max(0, CoerceFiniteNumber(value, this.rateHz));
        this.rateHz = value;
        return SendMessageToWorklet(this.audioWorkletNode, ChorusMessageCommandId.SetRateHz, value);
    }
    setMix(value) {
        value = Math.max(0, Math.min(1, CoerceFiniteNumber(value, this.mix)));
        this.mix = value;
        return SendMessageToWorklet(this.audioWorkletNode, ChorusMessageCommandId.SetMix, value);
    }
    setFeedback(value) {
        value = Math.max(0, Math.min(1, CoerceFiniteNumber(value, this.feedback)));
        this.feedback = value;
        return SendMessageToWorklet(this.audioWorkletNode, ChorusMessageCommandId.SetFeedback, value);
    }
}
