import { AdvancedDelayMessageCommandId, AdvancedDelayOptions, AudioWorkletProcessorNames } from "../../../typings";
import { clampDelayValue, DelayEngine, DelayEngineParameters, resolveStrictMode } from "./DelayEngine";

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

    public name: string = "AdvancedDelay";
    public label: string | null = "AdvancedDelay";

    public delayLeftMs: number = 375;
    public delayRightMs: number = 500;
    public feedback: number = 0.45;
    public crossFeedback: number = 0.2;
    public mix: number = 0.35;
    public lowCut: number = 120;
    public highCut: number = 6000;
    public modulationRate: number = 0.5;
    public modulationDepth: number = 0;
    public drive: number = 0.2;

    protected processorName: AudioWorkletProcessorNames = AudioWorkletProcessorNames.AdvancedDelay;

    constructor(options?: Partial<AdvancedDelayOptions>) {
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

    protected engineParameters(): DelayEngineParameters {
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
        }
    }

    public returnOptionsAsObject(): AdvancedDelayOptions {
        return {
            ...this.engineParameters(),
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

    public setCrossFeedback(crossFeedback: number): boolean {
        this.crossFeedback = clampDelayValue("crossFeedback", crossFeedback, this.crossFeedback);
        return this.send(AdvancedDelayMessageCommandId.SetCrossFeedback, this.crossFeedback);
    }

    public setMix(mix: number): boolean {
        this.mix = clampDelayValue("mix", mix, this.mix);
        return this.send(AdvancedDelayMessageCommandId.SetMix, this.mix);
    }

    public setLowCut(lowCut: number): boolean {
        this.lowCut = clampDelayValue("lowCut", lowCut, this.lowCut);
        return this.send(AdvancedDelayMessageCommandId.SetLowCut, this.lowCut);
    }

    public setHighCut(highCut: number): boolean {
        this.highCut = clampDelayValue("highCut", highCut, this.highCut);
        return this.send(AdvancedDelayMessageCommandId.SetHighCut, this.highCut);
    }

    public setModulationRate(modulationRate: number): boolean {
        this.modulationRate = clampDelayValue("modulationRate", modulationRate, this.modulationRate);
        return this.send(AdvancedDelayMessageCommandId.SetModulationRate, this.modulationRate);
    }

    public setModulationDepth(modulationDepth: number): boolean {
        this.modulationDepth = clampDelayValue("modulationDepth", modulationDepth, this.modulationDepth);
        return this.send(AdvancedDelayMessageCommandId.SetModulationDepth, this.modulationDepth);
    }

    public setDrive(drive: number): boolean {
        this.drive = clampDelayValue("drive", drive, this.drive);
        return this.send(AdvancedDelayMessageCommandId.SetDrive, this.drive);
    }
}
