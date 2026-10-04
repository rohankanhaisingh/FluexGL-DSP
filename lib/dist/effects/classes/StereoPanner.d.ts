import { Effector } from "../../core/classes/Effector";
import { StereoPannerOptions } from "../../typings";
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
export declare class StereoPanner extends Effector {
    name: string;
    label: string | null;
    pan: number;
    width: number;
    inputGainNode: GainNode | null;
    pannerNode: StereoPannerNode | null;
    /** Matrix gains: left-to-left, right-to-left, left-to-right, right-to-right. */
    private matrix;
    constructor(options?: Partial<StereoPannerOptions>);
    initializeOnAttachment(context: AudioContext): Promise<void>;
    get inputNode(): AudioNode | null;
    get outputNode(): AudioNode | null;
    returnOptionsAsObject(): StereoPannerOptions;
    /**
     * Sets the position in the stereo field, between -1 (left) and 1 (right).
     */
    setPan(pan: number): boolean;
    /**
     * Sets the stereo width, between 0 (mono) and 2 (extra wide). 1 leaves the image unchanged.
     */
    setWidth(width: number): boolean;
    /**
     * out L = L * (1 + w) / 2 + R * (1 - w) / 2
     * out R = L * (1 - w) / 2 + R * (1 + w) / 2
     */
    private matrixGains;
}
//# sourceMappingURL=StereoPanner.d.ts.map