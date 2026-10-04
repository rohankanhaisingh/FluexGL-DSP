import { AdvancedDelayMessageCommandId, AudioWorkletProcessorNames, PingPongDelayOptions } from "../../../typings";
import { clampDelayValue, DelayEngine, DelayEngineParameters, resolveStrictMode } from "./DelayEngine";

/**
 * A ping-pong delay: the input is summed to mono and the echoes bounce between
 * the left and right channel. The first echo is on the left.
 */
export class PingPongDelay extends DelayEngine {

    public name: string = "PingPongDelay";
    public label: string | null = "PingPongDelay";

    public delayMs: number = 300;
    public feedback: number = 0.5;
    public mix: number = 0.35;

    protected processorName: AudioWorkletProcessorNames = AudioWorkletProcessorNames.PingPongDelay;

    constructor(options?: Partial<PingPongDelayOptions>) {
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
            crossFeedback: 1,
            mix: this.mix,
            lowCut: 0,
            highCut: 0,
            modulationRate: 0,
            modulationDepth: 0,
            drive: 0
        }
    }

    public returnOptionsAsObject(): PingPongDelayOptions {
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
