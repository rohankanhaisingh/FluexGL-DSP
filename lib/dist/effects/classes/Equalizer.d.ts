import { Effector } from "../../core/classes/Effector";
import { EqualizerBand, EqualizerOptions, StrictMode } from "../../typings";
/**
 * A parametric equalizer with up to eight bands, processed in series in WebAssembly.
 *
 * Band types: "peaking", "lowshelf", "highshelf", "lowpass", "highpass", "notch" and "bandpass".
 * Without options, it starts as a flat 5-band EQ (low shelf, three peaking bands, high shelf).
 */
export declare class Equalizer extends Effector {
    /** Maximum number of bands. */
    static readonly MAX_BANDS: number;
    name: string;
    label: string | null;
    bands: EqualizerBand[];
    outputGain: number;
    strictMode: StrictMode;
    constructor(options?: Partial<EqualizerOptions>);
    initializeOnAttachment(context: AudioContext): Promise<void>;
    returnOptionsAsObject(): EqualizerOptions;
    /**
     * Returns a copy of a band, or null when the index does not exist.
     */
    getBand(index: number): EqualizerBand | null;
    /**
     * Changes a band. Only the given fields change. The index must be an existing band.
     */
    setBand(index: number, band: Partial<EqualizerBand>): boolean;
    /**
     * Adds a band at the end. Returns its index, or -1 when all eight bands are in use.
     */
    addBand(band: Partial<EqualizerBand>): number;
    /**
     * Removes a band. The bands after it move up one position.
     */
    removeBand(index: number): boolean;
    /**
     * Sets every gain of the peaking and shelf bands back to 0 dB.
     */
    flatten(): void;
    setOutputGain(outputGain: number): boolean;
    private sendBand;
}
//# sourceMappingURL=Equalizer.d.ts.map