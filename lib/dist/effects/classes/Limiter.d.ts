import { Effector } from "../../core/classes/Effector";
import { LimiterOptions } from "../../typings";
/**
 * Peak limiter that keeps the output around the ceiling, built on the native
 * Web Audio DynamicsCompressorNode (hard knee, ratio 20:1, fast attack).
 * Does not require WebAssembly.
 *
 *   input -> input gain -> DynamicsCompressorNode -> makeup compensation -> output
 *
 * The compressor does the actual limiting. Because its ratio is 20:1 rather than infinite,
 * and its attack is not instant, loud peaks can still pass slightly above the ceiling.
 * A soft clipper at the end catches those: it is fully linear below 90% of the ceiling,
 * and bends the rest smoothly towards the ceiling, so the sample peak never exceeds it.
 * It does not measure inter-sample (true) peaks.
 */
export declare class Limiter extends Effector {
    name: string;
    label: string | null;
    ceiling: number;
    release: number;
    inputGain: number;
    inputGainNode: GainNode | null;
    compressorNode: DynamicsCompressorNode | null;
    outputGainNode: GainNode | null;
    clipperNode: WaveShaperNode | null;
    constructor(options?: Partial<LimiterOptions>);
    initializeOnAttachment(context: AudioContext): Promise<void>;
    get inputNode(): AudioNode | null;
    get outputNode(): AudioNode | null;
    returnOptionsAsObject(): LimiterOptions;
    setCeiling(ceiling: number): boolean;
    setRelease(release: number): boolean;
    setInputGain(inputGain: number): boolean;
    /**
     * Current gain reduction in dB (0 or negative). Useful for metering.
     */
    get reduction(): number;
    /**
     * The Web Audio spec applies an automatic makeup gain inside the DynamicsCompressorNode:
     * (1 / fullRangeGain) ^ 0.6, where fullRangeGain is the curve's gain for a 0 dBFS input.
     * That would push the output above the ceiling, so it is undone here.
     */
    private makeupCompensation;
    /**
     * Linear up to 90% of the ceiling, then a tanh knee that approaches the ceiling.
     * Inputs beyond +-1 are mapped to the ends of the curve by the WaveShaperNode.
     */
    private clipperCurve;
    private setParam;
}
//# sourceMappingURL=Limiter.d.ts.map