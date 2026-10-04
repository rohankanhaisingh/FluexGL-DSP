import { AudioWorkletProcessorNames, PingPongDelayOptions } from "../../../typings";
import { DelayEngine, DelayEngineParameters } from "./DelayEngine";
/**
 * A ping-pong delay: the input is summed to mono and the echoes bounce between
 * the left and right channel. The first echo is on the left.
 */
export declare class PingPongDelay extends DelayEngine {
    name: string;
    label: string | null;
    delayMs: number;
    feedback: number;
    mix: number;
    protected processorName: AudioWorkletProcessorNames;
    constructor(options?: Partial<PingPongDelayOptions>);
    protected engineParameters(): DelayEngineParameters;
    returnOptionsAsObject(): PingPongDelayOptions;
    setDelayMs(delayMs: number): boolean;
    setFeedback(feedback: number): boolean;
    setMix(mix: number): boolean;
}
//# sourceMappingURL=PingPongDelay.d.ts.map