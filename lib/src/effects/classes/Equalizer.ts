import { Effector } from "../../core/classes/Effector";
import { AudioWorkletProcessorNames, EqualizerBand, EqualizerBandType, EqualizerMessageCommandId, EqualizerOptions, StrictMode } from "../../typings";
import { coerceFiniteNumber, createAudioWorkletNode, sendMessageToWorklet } from "../../utilities/helpers";

/** Band type ids, matching the Equalizer WASM struct. */
const BAND_TYPE_IDS: Record<EqualizerBandType, number> = {
    peaking: 0,
    lowshelf: 1,
    highshelf: 2,
    lowpass: 3,
    highpass: 4,
    notch: 5,
    bandpass: 6
};

const DEFAULT_BANDS: EqualizerBand[] = [
    { type: "lowshelf", frequency: 80, gain: 0, q: 0.7071, enabled: true },
    { type: "peaking", frequency: 250, gain: 0, q: 1, enabled: true },
    { type: "peaking", frequency: 1000, gain: 0, q: 1, enabled: true },
    { type: "peaking", frequency: 4000, gain: 0, q: 1, enabled: true },
    { type: "highshelf", frequency: 10000, gain: 0, q: 0.7071, enabled: true }
];

function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}

function resolveBand(band: Partial<EqualizerBand> | undefined, fallback: EqualizerBand): EqualizerBand {
    return {
        type: band?.type && band.type in BAND_TYPE_IDS ? band.type : fallback.type,
        frequency: clamp(coerceFiniteNumber(band?.frequency, fallback.frequency), 10, 24000),
        gain: clamp(coerceFiniteNumber(band?.gain, fallback.gain), -24, 24),
        q: clamp(coerceFiniteNumber(band?.q, fallback.q), 0.1, 24),
        enabled: typeof band?.enabled === "boolean" ? band.enabled : fallback.enabled
    }
}

/**
 * A parametric equalizer with up to eight bands, processed in series in WebAssembly.
 *
 * Band types: "peaking", "lowshelf", "highshelf", "lowpass", "highpass", "notch" and "bandpass".
 * Without options, it starts as a flat 5-band EQ (low shelf, three peaking bands, high shelf).
 */
export class Equalizer extends Effector {

    /** Maximum number of bands. */
    public static readonly MAX_BANDS: number = 8;

    public name: string = "Equalizer";
    public label: string | null = "Equalizer";

    public bands: EqualizerBand[] = [];
    public outputGain: number = 0;
    public strictMode: StrictMode = StrictMode.Disabled;

    constructor(options?: Partial<EqualizerOptions>) {
        super();

        const bands = options?.bands ?? DEFAULT_BANDS;

        this.bands = bands.slice(0, Equalizer.MAX_BANDS).map((band, i) => resolveBand(band, DEFAULT_BANDS[i] ?? DEFAULT_BANDS[2]));
        this.outputGain = clamp(coerceFiniteNumber(options?.outputGain, this.outputGain), -24, 24);
        this.strictMode = coerceFiniteNumber(options?.strictMode, this.strictMode) === StrictMode.Enabled ? StrictMode.Enabled : StrictMode.Disabled;
    }

    public async initializeOnAttachment(context: AudioContext): Promise<void> {

        if (this.context === context && this.audioWorkletNode) return;

        // parameterData only accepts numbers, so the bands are flattened.
        const parameters: Record<string, number> = {
            outputGain: this.outputGain,
            strictMode: this.strictMode
        };

        this.bands.forEach(function (band: EqualizerBand, i: number) {
            parameters[`band${i}Type`] = BAND_TYPE_IDS[band.type];
            parameters[`band${i}Frequency`] = band.frequency;
            parameters[`band${i}Gain`] = band.gain;
            parameters[`band${i}Q`] = band.q;
            parameters[`band${i}Enabled`] = band.enabled ? 1 : 0;
        });

        this.context = context;
        this.audioWorkletNode = createAudioWorkletNode(context, AudioWorkletProcessorNames.Equalizer, parameters);
        this.registerMessageEventListener(this.audioWorkletNode);
    }

    public returnOptionsAsObject(): EqualizerOptions {
        return {
            bands: this.bands.map(band => ({ ...band })),
            outputGain: this.outputGain,
            strictMode: this.strictMode
        }
    }

    /**
     * Returns a copy of a band, or null when the index does not exist.
     */
    public getBand(index: number): EqualizerBand | null {
        const band = this.bands[index];
        return band ? { ...band } : null;
    }

    /**
     * Changes a band. Only the given fields change. The index must be an existing band.
     */
    public setBand(index: number, band: Partial<EqualizerBand>): boolean {

        const current = this.bands[index];

        if (!current) return false;

        this.bands[index] = resolveBand(band, current);
        return this.sendBand(index);
    }

    /**
     * Adds a band at the end. Returns its index, or -1 when all eight bands are in use.
     */
    public addBand(band: Partial<EqualizerBand>): number {

        if (this.bands.length >= Equalizer.MAX_BANDS) return -1;

        this.bands.push(resolveBand(band, { type: "peaking", frequency: 1000, gain: 0, q: 1, enabled: true }));

        const index = this.bands.length - 1;
        this.sendBand(index);
        return index;
    }

    /**
     * Removes a band. The bands after it move up one position.
     */
    public removeBand(index: number): boolean {

        if (!this.bands[index]) return false;

        this.bands.splice(index, 1);

        // Resend every band from the removed index, and disable the now unused last slot.
        for (let i = index; i < this.bands.length; i++)
            this.sendBand(i);

        return sendMessageToWorklet(this.audioWorkletNode, EqualizerMessageCommandId.SetBand, {
            index: this.bands.length,
            type: 0,
            frequency: 1000,
            gain: 0,
            q: 0.7071,
            enabled: false
        });
    }

    /**
     * Sets every gain of the peaking and shelf bands back to 0 dB.
     */
    public flatten(): void {
        this.bands.forEach((band, i) => this.setBand(i, { gain: 0 }));
    }

    public setOutputGain(outputGain: number): boolean {
        this.outputGain = clamp(coerceFiniteNumber(outputGain, this.outputGain), -24, 24);
        return sendMessageToWorklet<EqualizerMessageCommandId, number>(this.audioWorkletNode, EqualizerMessageCommandId.SetOutputGain, this.outputGain);
    }

    private sendBand(index: number): boolean {

        const band = this.bands[index];

        return sendMessageToWorklet(this.audioWorkletNode, EqualizerMessageCommandId.SetBand, {
            index,
            type: BAND_TYPE_IDS[band.type],
            frequency: band.frequency,
            gain: band.gain,
            q: band.q,
            enabled: band.enabled
        });
    }
}
