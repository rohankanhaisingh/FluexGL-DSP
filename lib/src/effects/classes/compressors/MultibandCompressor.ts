import { Effector } from "../../../core/classes/Effector";
import { MultibandCompressorBandName, MultibandCompressorBandOptions, MultibandCompressorOptions } from "../../../typings";
import { coerceFiniteNumber } from "../../../utilities/helpers";
import { decibelsToGain, nativeCompressorMakeupGain } from "./Compressor";

/**
 * Butterworth Q. Two cascaded Butterworth filters form a Linkwitz-Riley (LR4) filter.
 * Note: the Web Audio API interprets Q of "lowpass" and "highpass" in dB, but Q of "allpass" linearly.
 */
const BUTTERWORTH_Q: number = Math.SQRT1_2;
const BUTTERWORTH_Q_DB: number = 20 * Math.log10(Math.SQRT1_2);

const MIN_CROSSOVER: number = 20;
const MAX_CROSSOVER: number = 20000;

/** The high crossover is kept at least this factor above the low crossover. */
const MIN_CROSSOVER_RATIO: number = 1.5;

const DEFAULT_BANDS: Record<MultibandCompressorBandName, MultibandCompressorBandOptions> = {
    low: { threshold: -24, knee: 6, ratio: 3, attack: 0.01, release: 0.2, makeupGain: 0 },
    mid: { threshold: -24, knee: 6, ratio: 3, attack: 0.005, release: 0.15, makeupGain: 0 },
    high: { threshold: -24, knee: 6, ratio: 3, attack: 0.002, release: 0.1, makeupGain: 0 }
};

interface BandNodes {
    compressor: DynamicsCompressorNode;
    makeup: GainNode;
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}

function resolveBand(band: Partial<MultibandCompressorBandOptions> | undefined, fallback: MultibandCompressorBandOptions): MultibandCompressorBandOptions {
    return {
        threshold: clamp(coerceFiniteNumber(band?.threshold, fallback.threshold), -100, 0),
        knee: clamp(coerceFiniteNumber(band?.knee, fallback.knee), 0, 40),
        ratio: clamp(coerceFiniteNumber(band?.ratio, fallback.ratio), 1, 20),
        attack: clamp(coerceFiniteNumber(band?.attack, fallback.attack), 0, 1),
        release: clamp(coerceFiniteNumber(band?.release, fallback.release), 0, 1),
        makeupGain: clamp(coerceFiniteNumber(band?.makeupGain, fallback.makeupGain), -24, 24)
    }
}

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
export class MultibandCompressor extends Effector {

    public name: string = "MultibandCompressor";
    public label: string | null = "MultibandCompressor";

    public lowCrossover: number = 200;
    public highCrossover: number = 2500;
    public outputGain: number = 0;

    public bands: Record<MultibandCompressorBandName, MultibandCompressorBandOptions> = {
        low: { ...DEFAULT_BANDS.low },
        mid: { ...DEFAULT_BANDS.mid },
        high: { ...DEFAULT_BANDS.high }
    };

    public inputGainNode: GainNode | null = null;
    public outputGainNode: GainNode | null = null;

    private lowCrossoverFilters: BiquadFilterNode[] = [];
    private highCrossoverFilters: BiquadFilterNode[] = [];
    private bandNodes: Record<MultibandCompressorBandName, BandNodes> | null = null;

    constructor(options?: Partial<MultibandCompressorOptions>) {
        super();

        this.bands = {
            low: resolveBand(options?.low, DEFAULT_BANDS.low),
            mid: resolveBand(options?.mid, DEFAULT_BANDS.mid),
            high: resolveBand(options?.high, DEFAULT_BANDS.high)
        };

        this.outputGain = clamp(coerceFiniteNumber(options?.outputGain, this.outputGain), -24, 24);
        this.setCrossoverValues(
            coerceFiniteNumber(options?.lowCrossover, this.lowCrossover),
            coerceFiniteNumber(options?.highCrossover, this.highCrossover)
        );
    }

    public async initializeOnAttachment(context: AudioContext): Promise<void> {

        if (this.context === context && this.inputGainNode && this.outputGainNode) return;

        this.context = context;

        const filter = (type: BiquadFilterType, frequency: number): BiquadFilterNode =>
            new BiquadFilterNode(context, { type, frequency, Q: type === "allpass" ? BUTTERWORTH_Q : BUTTERWORTH_Q_DB });

        const band = (name: MultibandCompressorBandName): BandNodes => {
            const options = this.bands[name];
            const compressor = new DynamicsCompressorNode(context, {
                threshold: options.threshold,
                knee: options.knee,
                ratio: options.ratio,
                attack: options.attack,
                release: options.release
            });
            const makeup = new GainNode(context, { gain: this.makeupGain(name) });

            compressor.connect(makeup);
            return { compressor, makeup };
        };

        this.inputGainNode = new GainNode(context);
        this.outputGainNode = new GainNode(context, { gain: decibelsToGain(this.outputGain) });
        this.bandNodes = { low: band("low"), mid: band("mid"), high: band("high") };

        // Low crossover: LR4 lowpass and highpass.
        const lowLp1 = filter("lowpass", this.lowCrossover), lowLp2 = filter("lowpass", this.lowCrossover);
        const lowHp1 = filter("highpass", this.lowCrossover), lowHp2 = filter("highpass", this.lowCrossover);

        // High crossover: LR4 lowpass and highpass on the upper part, plus the phase-matching allpass for the low band.
        const highLp1 = filter("lowpass", this.highCrossover), highLp2 = filter("lowpass", this.highCrossover);
        const highHp1 = filter("highpass", this.highCrossover), highHp2 = filter("highpass", this.highCrossover);
        const lowAllpass = filter("allpass", this.highCrossover);

        this.lowCrossoverFilters = [lowLp1, lowLp2, lowHp1, lowHp2];
        this.highCrossoverFilters = [highLp1, highLp2, highHp1, highHp2, lowAllpass];

        // Low band.
        this.inputGainNode.connect(lowLp1).connect(lowLp2).connect(lowAllpass).connect(this.bandNodes.low.compressor);

        // Everything above the low crossover.
        this.inputGainNode.connect(lowHp1).connect(lowHp2);

        // Mid band.
        lowHp2.connect(highLp1).connect(highLp2).connect(this.bandNodes.mid.compressor);

        // High band.
        lowHp2.connect(highHp1).connect(highHp2).connect(this.bandNodes.high.compressor);

        for (const name of ["low", "mid", "high"] as MultibandCompressorBandName[])
            this.bandNodes[name].makeup.connect(this.outputGainNode);
    }

    public get inputNode(): AudioNode | null {
        return this.inputGainNode;
    }

    public get outputNode(): AudioNode | null {
        return this.outputGainNode;
    }

    public returnOptionsAsObject(): MultibandCompressorOptions {
        return {
            lowCrossover: this.lowCrossover,
            highCrossover: this.highCrossover,
            low: { ...this.bands.low },
            mid: { ...this.bands.mid },
            high: { ...this.bands.high },
            outputGain: this.outputGain
        }
    }

    /**
     * Changes the settings of one band. Only the given fields change.
     */
    public setBand(name: MultibandCompressorBandName, options: Partial<MultibandCompressorBandOptions>): boolean {

        if (!(name in this.bands)) return false;

        this.bands[name] = resolveBand(options, this.bands[name]);

        const nodes = this.bandNodes?.[name];

        if (!nodes || !this.context) return false;

        const band = this.bands[name];
        const now = this.context.currentTime;

        nodes.compressor.threshold.setTargetAtTime(band.threshold, now, 0.01);
        nodes.compressor.knee.setTargetAtTime(band.knee, now, 0.01);
        nodes.compressor.ratio.setTargetAtTime(band.ratio, now, 0.01);
        nodes.compressor.attack.setTargetAtTime(band.attack, now, 0.01);
        nodes.compressor.release.setTargetAtTime(band.release, now, 0.01);
        nodes.makeup.gain.setTargetAtTime(this.makeupGain(name), now, 0.01);
        return true;
    }

    /**
     * Moves the crossovers (Hz). The high crossover is kept at least 1.5x above the low crossover.
     */
    public setCrossovers(lowCrossover: number, highCrossover: number): boolean {

        this.setCrossoverValues(lowCrossover, highCrossover);

        if (!this.context || this.lowCrossoverFilters.length === 0) return false;

        const now = this.context.currentTime;

        for (const f of this.lowCrossoverFilters) f.frequency.setTargetAtTime(this.lowCrossover, now, 0.01);
        for (const f of this.highCrossoverFilters) f.frequency.setTargetAtTime(this.highCrossover, now, 0.01);
        return true;
    }

    public setLowCrossover(frequency: number): boolean {
        return this.setCrossovers(frequency, this.highCrossover);
    }

    public setHighCrossover(frequency: number): boolean {
        return this.setCrossovers(this.lowCrossover, frequency);
    }

    public setOutputGain(outputGain: number): boolean {

        this.outputGain = clamp(coerceFiniteNumber(outputGain, this.outputGain), -24, 24);

        if (!this.outputGainNode || !this.context) return false;

        this.outputGainNode.gain.setTargetAtTime(decibelsToGain(this.outputGain), this.context.currentTime, 0.01);
        return true;
    }

    /**
     * Current gain reduction per band in dB (0 or negative). Useful for metering.
     */
    public get reduction(): Record<MultibandCompressorBandName, number> {
        return {
            low: this.bandNodes?.low.compressor.reduction ?? 0,
            mid: this.bandNodes?.mid.compressor.reduction ?? 0,
            high: this.bandNodes?.high.compressor.reduction ?? 0
        }
    }

    /**
     * The makeup gain of a band, with the automatic makeup gain of the native compressor undone,
     * so the three bands sum back flat as long as nothing is being compressed.
     */
    private makeupGain(name: MultibandCompressorBandName): number {
        const band = this.bands[name];
        return decibelsToGain(band.makeupGain) / nativeCompressorMakeupGain(band.threshold, band.knee, band.ratio);
    }

    private setCrossoverValues(lowCrossover: number, highCrossover: number): void {

        const low = clamp(coerceFiniteNumber(lowCrossover, this.lowCrossover), MIN_CROSSOVER, MAX_CROSSOVER / MIN_CROSSOVER_RATIO);
        const high = clamp(coerceFiniteNumber(highCrossover, this.highCrossover), low * MIN_CROSSOVER_RATIO, MAX_CROSSOVER);

        this.lowCrossover = low;
        this.highCrossover = high;
    }
}
