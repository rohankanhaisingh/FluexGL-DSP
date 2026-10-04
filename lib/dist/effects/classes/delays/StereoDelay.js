import { AdvancedDelayMessageCommandId, AudioWorkletProcessorNames } from "../../../typings";
import { clampDelayValue, DelayEngine, resolveStrictMode } from "./DelayEngine";
/**
 * A stereo delay: the left and right channel are delayed independently, each with
 * its own delay time. Different times (for example 300 and 450 ms) widen the sound.
 */
export class StereoDelay extends DelayEngine {
    name = "StereoDelay";
    label = "StereoDelay";
    delayLeftMs = 300;
    delayRightMs = 450;
    feedback = 0.35;
    mix = 0.35;
    processorName = AudioWorkletProcessorNames.StereoDelay;
    constructor(options) {
        super();
        this.delayLeftMs = clampDelayValue("delayMs", options?.delayLeftMs, this.delayLeftMs);
        this.delayRightMs = clampDelayValue("delayMs", options?.delayRightMs, this.delayRightMs);
        this.feedback = clampDelayValue("feedback", options?.feedback, this.feedback);
        this.mix = clampDelayValue("mix", options?.mix, this.mix);
        this.strictMode = resolveStrictMode(options?.strictMode, this.strictMode);
    }
    engineParameters() {
        return {
            delayLeftMs: this.delayLeftMs,
            delayRightMs: this.delayRightMs,
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
            delayLeftMs: this.delayLeftMs,
            delayRightMs: this.delayRightMs,
            feedback: this.feedback,
            mix: this.mix,
            strictMode: this.strictMode
        };
    }
    setDelayLeftMs(delayMs) {
        this.delayLeftMs = clampDelayValue("delayMs", delayMs, this.delayLeftMs);
        return this.send(AdvancedDelayMessageCommandId.SetDelayLeftMs, this.delayLeftMs);
    }
    setDelayRightMs(delayMs) {
        this.delayRightMs = clampDelayValue("delayMs", delayMs, this.delayRightMs);
        return this.send(AdvancedDelayMessageCommandId.SetDelayRightMs, this.delayRightMs);
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
