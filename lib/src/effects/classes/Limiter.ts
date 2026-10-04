import { Effector } from "../../core/classes/Effector";
import { LimiterOptions } from "../../typings";
import { coerceFiniteNumber } from "../../utilities/helpers";
import { decibelsToGain, nativeCompressorMakeupGain } from "./compressors/Compressor";

const LIMITER_RATIO: number = 20;
const LIMITER_ATTACK: number = 0.001;

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
export class Limiter extends Effector {

    public name: string = "Limiter";
    public label: string | null = "Limiter";

    public ceiling: number = -1;
    public release: number = 0.1;
    public inputGain: number = 0;

    public inputGainNode: GainNode | null = null;
    public compressorNode: DynamicsCompressorNode | null = null;
    public outputGainNode: GainNode | null = null;
    public clipperNode: WaveShaperNode | null = null;

    constructor(options?: Partial<LimiterOptions>) {
        super();

        this.ceiling = clamp(coerceFiniteNumber(options?.ceiling, this.ceiling), -24, 0);
        this.release = clamp(coerceFiniteNumber(options?.release, this.release), 0.01, 1);
        this.inputGain = clamp(coerceFiniteNumber(options?.inputGain, this.inputGain), -24, 24);
    }

    public async initializeOnAttachment(context: AudioContext): Promise<void> {

        if (this.context === context && this.inputGainNode && this.compressorNode && this.outputGainNode) return;

        this.context = context;

        this.inputGainNode = new GainNode(context, { gain: decibelsToGain(this.inputGain) });
        this.compressorNode = new DynamicsCompressorNode(context, {
            threshold: this.ceiling,
            knee: 0,
            ratio: LIMITER_RATIO,
            attack: LIMITER_ATTACK,
            release: this.release
        });
        this.outputGainNode = new GainNode(context, { gain: this.makeupCompensation() });
        this.clipperNode = new WaveShaperNode(context, { curve: this.clipperCurve(), oversample: "none" });

        this.inputGainNode.connect(this.compressorNode);
        this.compressorNode.connect(this.outputGainNode);
        this.outputGainNode.connect(this.clipperNode);
    }

    public get inputNode(): AudioNode | null {
        return this.inputGainNode;
    }

    public get outputNode(): AudioNode | null {
        return this.clipperNode;
    }

    public returnOptionsAsObject(): LimiterOptions {
        return {
            ceiling: this.ceiling,
            release: this.release,
            inputGain: this.inputGain
        }
    }

    public setCeiling(ceiling: number): boolean {

        this.ceiling = clamp(coerceFiniteNumber(ceiling, this.ceiling), -24, 0);

        const applied: boolean = this.setParam(this.compressorNode?.threshold, this.ceiling);
        this.setParam(this.outputGainNode?.gain, this.makeupCompensation());

        if (this.clipperNode)
            this.clipperNode.curve = this.clipperCurve();

        return applied;
    }

    public setRelease(release: number): boolean {
        this.release = clamp(coerceFiniteNumber(release, this.release), 0.01, 1);
        return this.setParam(this.compressorNode?.release, this.release);
    }

    public setInputGain(inputGain: number): boolean {
        this.inputGain = clamp(coerceFiniteNumber(inputGain, this.inputGain), -24, 24);
        return this.setParam(this.inputGainNode?.gain, decibelsToGain(this.inputGain));
    }

    /**
     * Current gain reduction in dB (0 or negative). Useful for metering.
     */
    public get reduction(): number {
        return this.compressorNode?.reduction ?? 0;
    }

    /**
     * The Web Audio spec applies an automatic makeup gain inside the DynamicsCompressorNode:
     * (1 / fullRangeGain) ^ 0.6, where fullRangeGain is the curve's gain for a 0 dBFS input.
     * That would push the output above the ceiling, so it is undone here.
     */
    private makeupCompensation(): number {
        return 1 / nativeCompressorMakeupGain(this.ceiling, 0, LIMITER_RATIO);
    }

    /**
     * Linear up to 90% of the ceiling, then a tanh knee that approaches the ceiling.
     * Inputs beyond +-1 are mapped to the ends of the curve by the WaveShaperNode.
     */
    private clipperCurve(): Float32Array<ArrayBuffer> {

        const size = 4096;
        const ceiling = decibelsToGain(this.ceiling);
        const knee = ceiling * 0.9;
        const curve = new Float32Array(size);

        for (let i = 0; i < size; i++) {

            const x = (i / (size - 1)) * 2 - 1;
            const magnitude = Math.abs(x);

            curve[i] = magnitude <= knee
                ? x
                : Math.sign(x) * (knee + (ceiling - knee) * Math.tanh((magnitude - knee) / (ceiling - knee)));
        }

        return curve;
    }

    private setParam(param: AudioParam | undefined, value: number): boolean {

        if (!param || !this.context) return false;

        param.setTargetAtTime(value, this.context.currentTime, 0.01);
        return true;
    }
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}
