import { AdvancedDelayMessageCommandId, AudioWorkletProcessorNames } from "../../../typings";
import { clampDelayValue, DelayEngine, resolveStrictMode } from "./DelayEngine";
/**
 * A mono delay: the input is summed to mono and fed through a single delay line,
 * so the echoes are identical on both channels.
 */
export class MonoDelay extends DelayEngine {
    name = "MonoDelay";
    label = "MonoDelay";
    delayMs = 300;
    feedback = 0.35;
    mix = 0.35;
    processorName = AudioWorkletProcessorNames.MonoDelay;
    constructor(options) {
        super();
        this.delayMs = clampDelayValue("delayMs", options?.delayMs, this.delayMs);
        this.feedback = clampDelayValue("feedback", options?.feedback, this.feedback);
        this.mix = clampDelayValue("mix", options?.mix, this.mix);
        this.strictMode = resolveStrictMode(options?.strictMode, this.strictMode);
    }
    engineParameters() {
        return {
            delayLeftMs: this.delayMs,
            delayRightMs: this.delayMs,
            feedback: this.feedback,
            crossFeedback: 0,
            mix: this.mix,
            lowCut: 0,
            highCut: 0,
            modulationRate: 0,
            modulationDepth: 0,
            drive: 0
        };
    }
    returnOptionsAsObject() {
        return {
            delayMs: this.delayMs,
            feedback: this.feedback,
            mix: this.mix,
            strictMode: this.strictMode
        };
    }
    setDelayMs(delayMs) {
        this.delayMs = clampDelayValue("delayMs", delayMs, this.delayMs);
        return this.send(AdvancedDelayMessageCommandId.SetDelayLeftMs, this.delayMs)
            && this.send(AdvancedDelayMessageCommandId.SetDelayRightMs, this.delayMs);
    }
    setFeedback(feedback) {
        this.feedback = clampDelayValue("feedback", feedback, this.feedback);
        return this.send(AdvancedDelayMessageCommandId.SetFeedback, this.feedback);
    }
    setMix(mix) {
        this.mix = clampDelayValue("mix", mix, this.mix);
        return this.send(AdvancedDelayMessageCommandId.SetMix, this.mix);
    }
}
