import { AudioWorkletProcessorNames, MonoDelayOptions } from "../../../typings";
import { DelayEngine, DelayEngineParameters } from "./DelayEngine";
/**
 * A mono delay: the input is summed to mono and fed through a single delay line,
 * so the echoes are identical on both channels.
 */
export declare class MonoDelay extends DelayEngine {
    name: string;
    label: string | null;
    delayMs: number;
    feedback: number;
    mix: number;
    protected processorName: AudioWorkletProcessorNames;
    constructor(options?: Partial<MonoDelayOptions>);
    protected engineParameters(): DelayEngineParameters;
    returnOptionsAsObject(): MonoDelayOptions;
    setDelayMs(delayMs: number): boolean;
    setFeedback(feedback: number): boolean;
    setMix(mix: number): boolean;
}
//# sourceMappingURL=MonoDelay.d.ts.map