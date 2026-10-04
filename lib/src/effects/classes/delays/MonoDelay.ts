import { AdvancedDelayMessageCommandId, AudioWorkletProcessorNames, MonoDelayOptions } from "../../../typings";
import { clampDelayValue, DelayEngine, DelayEngineParameters, resolveStrictMode } from "./DelayEngine";

/**
 * A mono delay: the input is summed to mono and fed through a single delay line,
 * so the echoes are identical on both channels.
 */
export class MonoDelay extends DelayEngine {

    public name: string = "MonoDelay";
    public label: string | null = "MonoDelay";

    public delayMs: number = 300;
    public feedback: number = 0.35;
    public mix: number = 0.35;

    protected processorName: AudioWorkletProcessorNames = AudioWorkletProcessorNames.MonoDelay;

    constructor(options?: Partial<MonoDelayOptions>) {
        super();

        this.delayMs = clampDelayValue("delayMs", options?.delayMs, this.delayMs);
        this.feedback = clampDelayValue("feedback", options?.feedback, this.feedback);
        this.mix = clampDelayValue("mix", options?.mix, this.mix);
        this.strictMode = resolveStrictMode(options?.strictMode, this.strictMode);
    }

    protected engineParameters(): DelayEngineParameters {
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
        }
    }

    public returnOptionsAsObject(): MonoDelayOptions {
        return {
            delayMs: this.delayMs,
            feedback: this.feedback,
            mix: this.mix,
            strictMode: this.strictMode
        }
    }

    public setDelayMs(delayMs: number): boolean {
        this.delayMs = clampDelayValue("delayMs", delayMs, this.delayMs);
        return this.send(AdvancedDelayMessageCommandId.SetDelayLeftMs, this.delayMs)
            && this.send(AdvancedDelayMessageCommandId.SetDelayRightMs, this.delayMs);
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
