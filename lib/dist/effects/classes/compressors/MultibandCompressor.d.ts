import { Effector } from "../../../core/classes/Effector";
import { MultibandCompressorBandName, MultibandCompressorBandOptions, MultibandCompressorOptions } from "../../../typings";
/**
 * A 3-band compressor, built from native Web Audio nodes, so it does not require WebAssembly.
 * The signal is split into a low, mid and high band, every band is compressed separately,
 * and the bands are summed again. This controls, for example, boomy lows without
 * pumping the rest of the mix.
 *
 *   input -+-> LR4 lowpass (low)  -> allpass (high crossover) -> compressor -> makeup -+
 *          +-> LR4 highpass (low) -+-> LR4 lowpass (high)      -> compressor -> makeup -+-> output gain -> output
 *                                  +-> LR4 highpass (high)     -> compressor -> makeup -+
 *
 * The crossovers are 4th-order Linkwitz-Riley filters (two cascaded Butterworth biquads).
 * The automatic makeup gain of the native compressors is undone per band, so `makeupGain`
 * is the only gain that is added.
 * The low band also passes through an allpass at the high crossover, so it has the same
 * phase as the other two bands, and the bands sum back flat when no compression happens.
 */
export declare class MultibandCompressor extends Effector {
    name: string;
    label: string | null;
    lowCrossover: number;
    highCrossover: number;
    outputGain: number;
    bands: Record<MultibandCompressorBandName, MultibandCompressorBandOptions>;
    inputGainNode: GainNode | null;
    outputGainNode: GainNode | null;
    private lowCrossoverFilters;
    private highCrossoverFilters;
    private bandNodes;
    constructor(options?: Partial<MultibandCompressorOptions>);
    initializeOnAttachment(context: AudioContext): Promise<void>;
    get inputNode(): AudioNode | null;
    get outputNode(): AudioNode | null;
    returnOptionsAsObject(): MultibandCompressorOptions;
    /**
     * Changes the settings of one band. Only the given fields change.
     */
    setBand(name: MultibandCompressorBandName, options: Partial<MultibandCompressorBandOptions>): boolean;
    /**
     * Moves the crossovers (Hz). The high crossover is kept at least 1.5x above the low crossover.
     */
    setCrossovers(lowCrossover: number, highCrossover: number): boolean;
    setLowCrossover(frequency: number): boolean;
    setHighCrossover(frequency: number): boolean;
    setOutputGain(outputGain: number): boolean;
    /**
     * Current gain reduction per band in dB (0 or negative). Useful for metering.
     */
    get reduction(): Record<MultibandCompressorBandName, number>;
    /**
     * The makeup gain of a band, with the automatic makeup gain of the native compressor undone,
     * so the three bands sum back flat as long as nothing is being compressed.
     */
    private makeupGain;
    private setCrossoverValues;
}
//# sourceMappingURL=MultibandCompressor.d.ts.map