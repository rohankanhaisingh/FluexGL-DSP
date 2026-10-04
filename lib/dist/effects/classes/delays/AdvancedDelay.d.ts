import { AdvancedDelayOptions, AudioWorkletProcessorNames } from "../../../typings";
import { DelayEngine, DelayEngineParameters } from "./DelayEngine";
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
export declare class AdvancedDelay extends DelayEngine {
    name: string;
    label: string | null;
    delayLeftMs: number;
    delayRightMs: number;
    feedback: number;
    crossFeedback: number;
    mix: number;
    lowCut: number;
    highCut: number;
    modulationRate: number;
    modulationDepth: number;
    drive: number;
    protected processorName: AudioWorkletProcessorNames;
    constructor(options?: Partial<AdvancedDelayOptions>);
    protected engineParameters(): DelayEngineParameters;
    returnOptionsAsObject(): AdvancedDelayOptions;
    setDelayLeftMs(delayMs: number): boolean;
    setDelayRightMs(delayMs: number): boolean;
    setFeedback(feedback: number): boolean;
    setCrossFeedback(crossFeedback: number): boolean;
    setMix(mix: number): boolean;
    setLowCut(lowCut: number): boolean;
    setHighCut(highCut: number): boolean;
    setModulationRate(modulationRate: number): boolean;
    setModulationDepth(modulationDepth: number): boolean;
    setDrive(drive: number): boolean;
}
//# sourceMappingURL=AdvancedDelay.d.ts.map