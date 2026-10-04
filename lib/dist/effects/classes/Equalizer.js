import { Effector } from "../../core/classes/Effector";
import { AudioWorkletProcessorNames, EqualizerMessageCommandId, StrictMode } from "../../typings";
import { coerceFiniteNumber, createAudioWorkletNode, sendMessageToWorklet } from "../../utilities/helpers";
/** Band type ids, matching the Equalizer WASM struct. */
const BAND_TYPE_IDS = {
    peaking: 0,
    lowshelf: 1,
    highshelf: 2,
    lowpass: 3,
    highpass: 4,
    notch: 5,
    bandpass: 6
};
const DEFAULT_BANDS = [
    { type: "lowshelf", frequency: 80, gain: 0, q: 0.7071, enabled: true },
    { type: "peaking", frequency: 250, gain: 0, q: 1, enabled: true },
    { type: "peaking", frequency: 1000, gain: 0, q: 1, enabled: true },
    { type: "peaking", frequency: 4000, gain: 0, q: 1, enabled: true },
    { type: "highshelf", frequency: 10000, gain: 0, q: 0.7071, enabled: true }
];
function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}
function resolveBand(band, fallback) {
    return {
        type: band?.type && band.type in BAND_TYPE_IDS ? band.type : fallback.type,
        frequency: clamp(coerceFiniteNumber(band?.frequency, fallback.frequency), 10, 24000),
        gain: clamp(coerceFiniteNumber(band?.gain, fallback.gain), -24, 24),
        q: clamp(coerceFiniteNumber(band?.q, fallback.q), 0.1, 24),
        enabled: typeof band?.enabled === "boolean" ? band.enabled : fallback.enabled
    };
}
/**
 * A parametric equalizer with up to eight bands, processed in series in WebAssembly.
 *
 * Band types: "peaking", "lowshelf", "highshelf", "lowpass", "highpass", "notch" and "bandpass".
 * Without options, it starts as a flat 5-band EQ (low shelf, three peaking bands, high shelf).
 */
export class Equalizer extends Effector {
    /** Maximum number of bands. */
    static MAX_BANDS = 8;
    name = "Equalizer";
    label = "Equalizer";
    bands = [];
    outputGain = 0;
    strictMode = StrictMode.Disabled;
    constructor(options) {
        super();
        const bands = options?.bands ?? DEFAULT_BANDS;
        this.bands = bands.slice(0, Equalizer.MAX_BANDS).map((band, i) => resolveBand(band, DEFAULT_BANDS[i] ?? DEFAULT_BANDS[2]));
        this.outputGain = clamp(coerceFiniteNumber(options?.outputGain, this.outputGain), -24, 24);
        this.strictMode = coerceFiniteNumber(options?.strictMode, this.strictMode) === StrictMode.Enabled ? StrictMode.Enabled : StrictMode.Disabled;
    }
    async initializeOnAttachment(context) {
        if (this.context === context && this.audioWorkletNode)
            return;
        // parameterData only accepts numbers, so the bands are flattened.
        const parameters = {
            outputGain: this.outputGain,
            strictMode: this.strictMode
        };
        this.bands.forEach(function (band, i) {
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
    returnOptionsAsObject() {
        return {
            bands: this.bands.map(band => ({ ...band })),
            outputGain: this.outputGain,
            strictMode: this.strictMode
        };
    }
    /**
     * Returns a copy of a band, or null when the index does not exist.
     */
    getBand(index) {
        const band = this.bands[index];
        return band ? { ...band } : null;
    }
    /**
     * Changes a band. Only the given fields change. The index must be an existing band.
     */
    setBand(index, band) {
        const current = this.bands[index];
        if (!current)
            return false;
        this.bands[index] = resolveBand(band, current);
        return this.sendBand(index);
    }
    /**
     * Adds a band at the end. Returns its index, or -1 when all eight bands are in use.
     */
    addBand(band) {
        if (this.bands.length >= Equalizer.MAX_BANDS)
            return -1;
        this.bands.push(resolveBand(band, { type: "peaking", frequency: 1000, gain: 0, q: 1, enabled: true }));
        const index = this.bands.length - 1;
        this.sendBand(index);
        return index;
    }
    /**
     * Removes a band. The bands after it move up one position.
     */
    removeBand(index) {
        if (!this.bands[index])
            return false;
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
    flatten() {
        this.bands.forEach((band, i) => this.setBand(i, { gain: 0 }));
    }
    setOutputGain(outputGain) {
        this.outputGain = clamp(coerceFiniteNumber(outputGain, this.outputGain), -24, 24);
        return sendMessageToWorklet(this.audioWorkletNode, EqualizerMessageCommandId.SetOutputGain, this.outputGain);
    }
    sendBand(index) {
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
