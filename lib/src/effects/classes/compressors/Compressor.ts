import { Effector } from "../../../core/classes/Effector";
import { CompressorOptions } from "../../../typings";
import { coerceFiniteNumber } from "../../../utilities/helpers";

/**
 * Dynamic range compressor, built on the native Web Audio DynamicsCompressorNode.
 * Does not require WebAssembly, so it can be used before the DSP pipeline is initialized.
 *
 *   input -> DynamicsCompressorNode -> makeup gain -> output
 */
export class Compressor extends Effector {

    public name: string = "Compressor";
    public label: string | null = "Compressor";

    public threshold: number = -24;
    public knee: number = 30;
    public ratio: number = 4;
    public attack: number = 0.003;
    public release: number = 0.25;
    public makeupGain: number = 0;

    public compressorNode: DynamicsCompressorNode | null = null;
    public makeupGainNode: GainNode | null = null;

    constructor(options?: Partial<CompressorOptions>) {
        super();

        this.threshold = clamp(coerceFiniteNumber(options?.threshold, this.threshold), -100, 0);
        this.knee = clamp(coerceFiniteNumber(options?.knee, this.knee), 0, 40);
        this.ratio = clamp(coerceFiniteNumber(options?.ratio, this.ratio), 1, 20);
        this.attack = clamp(coerceFiniteNumber(options?.attack, this.attack), 0, 1);
        this.release = clamp(coerceFiniteNumber(options?.release, this.release), 0, 1);
        this.makeupGain = clamp(coerceFiniteNumber(options?.makeupGain, this.makeupGain), -24, 24);
    }

    public async initializeOnAttachment(context: AudioContext): Promise<void> {

        if (this.context === context && this.compressorNode && this.makeupGainNode) return;

        this.context = context;

        this.compressorNode = new DynamicsCompressorNode(context, {
            threshold: this.threshold,
            knee: this.knee,
            ratio: this.ratio,
            attack: this.attack,
            release: this.release
        });

        this.makeupGainNode = new GainNode(context, { gain: decibelsToGain(this.makeupGain) });
        this.compressorNode.connect(this.makeupGainNode);
    }

    public get inputNode(): AudioNode | null {
        return this.compressorNode;
    }

    public get outputNode(): AudioNode | null {
        return this.makeupGainNode;
    }

    public returnOptionsAsObject(): CompressorOptions {
        return {
            threshold: this.threshold,
            knee: this.knee,
            ratio: this.ratio,
            attack: this.attack,
            release: this.release,
            makeupGain: this.makeupGain
        }
    }

    public setThreshold(threshold: number): boolean {
        this.threshold = clamp(coerceFiniteNumber(threshold, this.threshold), -100, 0);
        return this.setParam(this.compressorNode?.threshold, this.threshold);
    }

    public setKnee(knee: number): boolean {
        this.knee = clamp(coerceFiniteNumber(knee, this.knee), 0, 40);
        return this.setParam(this.compressorNode?.knee, this.knee);
    }

    public setRatio(ratio: number): boolean {
        this.ratio = clamp(coerceFiniteNumber(ratio, this.ratio), 1, 20);
        return this.setParam(this.compressorNode?.ratio, this.ratio);
    }

    public setAttack(attack: number): boolean {
        this.attack = clamp(coerceFiniteNumber(attack, this.attack), 0, 1);
        return this.setParam(this.compressorNode?.attack, this.attack);
    }

    public setRelease(release: number): boolean {
        this.release = clamp(coerceFiniteNumber(release, this.release), 0, 1);
        return this.setParam(this.compressorNode?.release, this.release);
    }

    public setMakeupGain(makeupGain: number): boolean {
        this.makeupGain = clamp(coerceFiniteNumber(makeupGain, this.makeupGain), -24, 24);
        return this.setParam(this.makeupGainNode?.gain, decibelsToGain(this.makeupGain));
    }

    /**
     * Current gain reduction in dB (0 or negative). Useful for metering.
     */
    public get reduction(): number {
        return this.compressorNode?.reduction ?? 0;
    }

    /**
     * Applies a value with a short ramp to avoid clicks. Returns false when the effect is not attached yet;
     * the value is then applied once the effect is attached.
     */
    protected setParam(param: AudioParam | undefined, value: number): boolean {

        if (!param || !this.context) return false;

        param.setTargetAtTime(value, this.context.currentTime, 0.01);
        return true;
    }
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}

export function decibelsToGain(decibels: number): number {
    return Math.pow(10, decibels / 20);
}

function gainToDecibels(gain: number): number {
    return 20 * Math.log10(gain);
}

/**
 * The automatic makeup gain (linear) that a native DynamicsCompressorNode applies, for the given
 * static curve. The Web Audio spec defines it as (1 / fullRangeGain) ^ 0.6, where fullRangeGain
 * is the curve's gain for a 0 dBFS input. This mirrors the implementation in Chromium's
 * DynamicsCompressorKernel (also used by Firefox), including its soft knee.
 *
 * Dividing by this value undoes the automatic makeup gain.
 */
export function nativeCompressorMakeupGain(threshold: number, knee: number, ratio: number): number {

    const linearThreshold = decibelsToGain(threshold);
    const kneeThresholdDb = threshold + knee;
    const kneeThreshold = decibelsToGain(kneeThresholdDb);
    const slope = 1 / ratio;

    const kneeCurve = (x: number, k: number): number =>
        x < linearThreshold ? x : linearThreshold + (1 - Math.exp(-k * (x - linearThreshold))) / k;

    const slopeAt = (x: number, k: number): number => {

        if (x < linearThreshold) return 1;

        const x2 = x * 1.001;
        return (gainToDecibels(kneeCurve(x2, k)) - gainToDecibels(kneeCurve(x, k))) / (gainToDecibels(x2) - gainToDecibels(x));
    };

    // Find the knee sharpness k at which the knee curve ends with the slope of the ratio.
    let minK = 0.1, maxK = 10000, k = 5;

    for (let i = 0; i < 15; i++) {
        if (slopeAt(kneeThreshold, k) < slope) maxK = k;
        else minK = k;

        k = Math.sqrt(minK * maxK);
    }

    const kneeEndDb = gainToDecibels(kneeCurve(kneeThreshold, k));
    const fullRangeGain = 1 < kneeThreshold
        ? kneeCurve(1, k)
        : decibelsToGain(kneeEndDb + slope * (0 - kneeThresholdDb));

    return Math.pow(1 / fullRangeGain, 0.6);
}
