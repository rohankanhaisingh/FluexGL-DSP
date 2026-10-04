import { Effector } from "../../core/classes/Effector";
import { StereoPannerOptions } from "../../typings";
import { coerceFiniteNumber } from "../../utilities/helpers";

function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}

/**
 * Positions a signal in the stereo field and controls its stereo width.
 * Built from native Web Audio nodes, so it does not require WebAssembly.
 *
 *   input -> splitter -> width matrix -> merger -> StereoPannerNode -> output
 *
 * The width matrix is a mid/side operation: the side signal (L - R) is scaled by
 * `width`. 0 collapses the signal to mono, 1 leaves it unchanged, 2 doubles the side signal.
 * A mono input is upmixed to both channels first.
 */
export class StereoPanner extends Effector {

    public name: string = "StereoPanner";
    public label: string | null = "StereoPanner";

    public pan: number = 0;
    public width: number = 1;

    public inputGainNode: GainNode | null = null;
    public pannerNode: StereoPannerNode | null = null;

    /** Matrix gains: left-to-left, right-to-left, left-to-right, right-to-right. */
    private matrix: { ll: GainNode, rl: GainNode, lr: GainNode, rr: GainNode } | null = null;

    constructor(options?: Partial<StereoPannerOptions>) {
        super();

        this.pan = clamp(coerceFiniteNumber(options?.pan, this.pan), -1, 1);
        this.width = clamp(coerceFiniteNumber(options?.width, this.width), 0, 2);
    }

    public async initializeOnAttachment(context: AudioContext): Promise<void> {

        if (this.context === context && this.inputGainNode && this.pannerNode) return;

        this.context = context;

        // Explicit stereo, so a mono input is upmixed to both channels.
        this.inputGainNode = new GainNode(context, { channelCount: 2, channelCountMode: "explicit", channelInterpretation: "speakers" });

        const splitter = new ChannelSplitterNode(context, { numberOfOutputs: 2 });
        const merger = new ChannelMergerNode(context, { numberOfInputs: 2 });
        const [direct, cross] = this.matrixGains();

        this.matrix = {
            ll: new GainNode(context, { gain: direct }),
            rl: new GainNode(context, { gain: cross }),
            lr: new GainNode(context, { gain: cross }),
            rr: new GainNode(context, { gain: direct })
        };

        this.pannerNode = new StereoPannerNode(context, { pan: this.pan });

        this.inputGainNode.connect(splitter);

        splitter.connect(this.matrix.ll, 0).connect(merger, 0, 0);
        splitter.connect(this.matrix.rl, 1).connect(merger, 0, 0);
        splitter.connect(this.matrix.lr, 0).connect(merger, 0, 1);
        splitter.connect(this.matrix.rr, 1).connect(merger, 0, 1);

        merger.connect(this.pannerNode);
    }

    public get inputNode(): AudioNode | null {
        return this.inputGainNode;
    }

    public get outputNode(): AudioNode | null {
        return this.pannerNode;
    }

    public returnOptionsAsObject(): StereoPannerOptions {
        return {
            pan: this.pan,
            width: this.width
        }
    }

    /**
     * Sets the position in the stereo field, between -1 (left) and 1 (right).
     */
    public setPan(pan: number): boolean {

        this.pan = clamp(coerceFiniteNumber(pan, this.pan), -1, 1);

        if (!this.pannerNode || !this.context) return false;

        this.pannerNode.pan.setTargetAtTime(this.pan, this.context.currentTime, 0.01);
        return true;
    }

    /**
     * Sets the stereo width, between 0 (mono) and 2 (extra wide). 1 leaves the image unchanged.
     */
    public setWidth(width: number): boolean {

        this.width = clamp(coerceFiniteNumber(width, this.width), 0, 2);

        if (!this.matrix || !this.context) return false;

        const [direct, cross] = this.matrixGains();
        const now = this.context.currentTime;

        this.matrix.ll.gain.setTargetAtTime(direct, now, 0.01);
        this.matrix.rr.gain.setTargetAtTime(direct, now, 0.01);
        this.matrix.rl.gain.setTargetAtTime(cross, now, 0.01);
        this.matrix.lr.gain.setTargetAtTime(cross, now, 0.01);
        return true;
    }

    /**
     * out L = L * (1 + w) / 2 + R * (1 - w) / 2
     * out R = L * (1 - w) / 2 + R * (1 + w) / 2
     */
    private matrixGains(): [number, number] {
        return [(1 + this.width) / 2, (1 - this.width) / 2];
    }
}
