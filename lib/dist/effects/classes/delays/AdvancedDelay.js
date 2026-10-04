import { AdvancedDelayMessageCommandId, AudioWorkletProcessorNames } from "../../../typings";
import { clampDelayValue, DelayEngine, resolveStrictMode } from "./DelayEngine";
/**
 * A stereo delay with every control of the delay engine:
 *
 * - Separate left and right delay times.
 * - Cross feedback, from independent sides (0) to ping-pong (1).
 * - A low cut and high cut in the feedback path, so every repeat gets thinner or darker.
 * - Delay time modulation, for chorus-like movement or tape wow.
 * - Saturation in the feedback path, which warms up the repeats and keeps high feedback in check.
 *
 * Delay time changes glide smoothly, so automating the time gives tape-like pitch bends instead of clicks.
 */
export class AdvancedDelay extends DelayEngine {
    name = "AdvancedDelay";
    label = "AdvancedDelay";
    delayLeftMs = 375;
    delayRightMs = 500;
    feedback = 0.45;
    crossFeedback = 0.2;
    mix = 0.35;
    lowCut = 120;
    highCut = 6000;
    modulationRate = 0.5;
    modulationDepth = 0;
    drive = 0.2;
    processorName = AudioWorkletProcessorNames.AdvancedDelay;
    constructor(options) {
        super();
        this.delayLeftMs = clampDelayValue("delayMs", options?.delayLeftMs, this.delayLeftMs);
        this.delayRightMs = clampDelayValue("delayMs", options?.delayRightMs, this.delayRightMs);
        this.feedback = clampDelayValue("feedback", options?.feedback, this.feedback);
        this.crossFeedback = clampDelayValue("crossFeedback", options?.crossFeedback, this.crossFeedback);
        this.mix = clampDelayValue("mix", options?.mix, this.mix);
        this.lowCut = clampDelayValue("lowCut", options?.lowCut, this.lowCut);
        this.highCut = clampDelayValue("highCut", options?.highCut, this.highCut);
        this.modulationRate = clampDelayValue("modulationRate", options?.modulationRate, this.modulationRate);
        this.modulationDepth = clampDelayValue("modulationDepth", options?.modulationDepth, this.modulationDepth);
        this.drive = clampDelayValue("drive", options?.drive, this.drive);
        this.strictMode = resolveStrictMode(options?.strictMode, this.strictMode);
    }
    engineParameters() {
        return {
            delayLeftMs: this.delayLeftMs,
            delayRightMs: this.delayRightMs,
            feedback: this.feedback,
            crossFeedback: this.crossFeedback,
            mix: this.mix,
            lowCut: this.lowCut,
            highCut: this.highCut,
            modulationRate: this.modulationRate,
            modulationDepth: this.modulationDepth,
            drive: this.drive
        };
    }
    returnOptionsAsObject() {
        return {
            ...this.engineParameters(),
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
    setCrossFeedback(crossFeedback) {
        this.crossFeedback = clampDelayValue("crossFeedback", crossFeedback, this.crossFeedback);
        return this.send(AdvancedDelayMessageCommandId.SetCrossFeedback, this.crossFeedback);
    }
    setMix(mix) {
        this.mix = clampDelayValue("mix", mix, this.mix);
        return this.send(AdvancedDelayMessageCommandId.SetMix, this.mix);
    }
    setLowCut(lowCut) {
        this.lowCut = clampDelayValue("lowCut", lowCut, this.lowCut);
        return this.send(AdvancedDelayMessageCommandId.SetLowCut, this.lowCut);
    }
    setHighCut(highCut) {
        this.highCut = clampDelayValue("highCut", highCut, this.highCut);
        return this.send(AdvancedDelayMessageCommandId.SetHighCut, this.highCut);
    }
    setModulationRate(modulationRate) {
        this.modulationRate = clampDelayValue("modulationRate", modulationRate, this.modulationRate);
        return this.send(AdvancedDelayMessageCommandId.SetModulationRate, this.modulationRate);
    }
    setModulationDepth(modulationDepth) {
        this.modulationDepth = clampDelayValue("modulationDepth", modulationDepth, this.modulationDepth);
        return this.send(AdvancedDelayMessageCommandId.SetModulationDepth, this.modulationDepth);
    }
    setDrive(drive) {
        this.drive = clampDelayValue("drive", drive, this.drive);
        return this.send(AdvancedDelayMessageCommandId.SetDrive, this.drive);
    }
}
