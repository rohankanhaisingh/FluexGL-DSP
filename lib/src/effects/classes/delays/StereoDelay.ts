import { AdvancedDelayMessageCommandId, AudioWorkletProcessorNames, StereoDelayOptions } from "../../../typings";
import { clampDelayValue, DelayEngine, DelayEngineParameters, resolveStrictMode } from "./DelayEngine";

/**
 * A stereo delay: the left and right channel are delayed independently, each with
 * its own delay time. Different times (for example 300 and 450 ms) widen the sound.
 */
export class StereoDelay extends DelayEngine {

    public name: string = "StereoDelay";
    public label: string | null = "StereoDelay";

    public delayLeftMs: number = 300;
    public delayRightMs: number = 450;
    public feedback: number = 0.35;
    public mix: number = 0.35;

    protected processorName: AudioWorkletProcessorNames = AudioWorkletProcessorNames.StereoDelay;

    constructor(options?: Partial<StereoDelayOptions>) {
        super();

        this.delayLeftMs = clampDelayValue("delayMs", options?.delayLeftMs, this.delayLeftMs);
        this.delayRightMs = clampDelayValue("delayMs", options?.delayRightMs, this.delayRightMs);
        this.feedback = clampDelayValue("feedback", options?.feedback, this.feedback);
        this.mix = clampDelayValue("mix", options?.mix, this.mix);
        this.strictMode = resolveStrictMode(options?.strictMode, this.strictMode);
    }

    protected engineParameters(): DelayEngineParameters {
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
        }
    }

    public returnOptionsAsObject(): StereoDelayOptions {
        return {
            delayLeftMs: this.delayLeftMs,
            delayRightMs: this.delayRightMs,
            feedback: this.feedback,
            mix: this.mix,
            strictMode: this.strictMode
        }
    }

    public setDelayLeftMs(delayMs: number): boolean {
        this.delayLeftMs = clampDelayValue("delayMs", delayMs, this.delayLeftMs);
        return this.send(AdvancedDelayMessageCommandId.SetDelayLeftMs, this.delayLeftMs);
    }

    public setDelayRightMs(delayMs: number): boolean {
        this.delayRightMs = clampDelayValue("delayMs", delayMs, this.delayRightMs);
        return this.send(AdvancedDelayMessageCommandId.SetDelayRightMs, this.delayRightMs);
    }

    public setFeedback(feedback: number): boolean {
        this.feedback = clampDelayValue("feedback", feedback, this.feedback);
        return this.send(AdvancedDelayMessageCommandId.SetFeedback, this.feedback);
    }

    public setMix(mix: number): boolean {
        this.mix = clampDelayValue("mix", mix, this.mix);
        return this.send(AdvancedDelayMessageCommandId.SetMix, this.mix);
    }
}
