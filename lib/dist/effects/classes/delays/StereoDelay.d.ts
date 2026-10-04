import { AudioWorkletProcessorNames, StereoDelayOptions } from "../../../typings";
import { DelayEngine, DelayEngineParameters } from "./DelayEngine";
/**
 * A stereo delay: the left and right channel are delayed independently, each with
 * its own delay time. Different times (for example 300 and 450 ms) widen the sound.
 */
export declare class StereoDelay extends DelayEngine {
    name: string;
    label: string | null;
    delayLeftMs: number;
    delayRightMs: number;
    feedback: number;
    mix: number;
    protected processorName: AudioWorkletProcessorNames;
    constructor(options?: Partial<StereoDelayOptions>);
    protected engineParameters(): DelayEngineParameters;
    returnOptionsAsObject(): StereoDelayOptions;
    setDelayLeftMs(delayMs: number): boolean;
    setDelayRightMs(delayMs: number): boolean;
    setFeedback(feedback: number): boolean;
    setMix(mix: number): boolean;
}
//# sourceMappingURL=StereoDelay.d.ts.map