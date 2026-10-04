import { Effector } from "../../../core/classes/Effector";
import { CompressorOptions } from "../../../typings";
/**
 * Dynamic range compressor, built on the native Web Audio DynamicsCompressorNode.
 * Does not require WebAssembly, so it can be used before the DSP pipeline is initialized.
 *
 *   input -> DynamicsCompressorNode -> makeup gain -> output
 */
export declare class Compressor extends Effector {
    name: string;
    label: string | null;
    threshold: number;
    knee: number;
    ratio: number;
    attack: number;
    release: number;
    makeupGain: number;
    compressorNode: DynamicsCompressorNode | null;
    makeupGainNode: GainNode | null;
    constructor(options?: Partial<CompressorOptions>);
    initializeOnAttachment(context: AudioContext): Promise<void>;
    get inputNode(): AudioNode | null;
    get outputNode(): AudioNode | null;
    returnOptionsAsObject(): CompressorOptions;
    setThreshold(threshold: number): boolean;
    setKnee(knee: number): boolean;
    setRatio(ratio: number): boolean;
    setAttack(attack: number): boolean;
    setRelease(release: number): boolean;
    setMakeupGain(makeupGain: number): boolean;
    /**
     * Current gain reduction in dB (0 or negative). Useful for metering.
     */
    get reduction(): number;
    /**
     * Applies a value with a short ramp to avoid clicks. Returns false when the effect is not attached yet;
     * the value is then applied once the effect is attached.
     */
    protected setParam(param: AudioParam | undefined, value: number): boolean;
}
export declare function decibelsToGain(decibels: number): number;
/**
 * The automatic makeup gain (linear) that a native DynamicsCompressorNode applies, for the given
 * static curve. The Web Audio spec defines it as (1 / fullRangeGain) ^ 0.6, where fullRangeGain
 * is the curve's gain for a 0 dBFS input. This mirrors the implementation in Chromium's
 * DynamicsCompressorKernel (also used by Firefox), including its soft knee.
 *
 * Dividing by this value undoes the automatic makeup gain.
 */
export declare function nativeCompressorMakeupGain(threshold: number, knee: number, ratio: number): number;
//# sourceMappingURL=Compressor.d.ts.map