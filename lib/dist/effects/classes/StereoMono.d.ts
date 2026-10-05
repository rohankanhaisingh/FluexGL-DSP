import { Effector } from "../../core/classes/Effector";
import { Channel } from "../../core/classes/Channel";
import { StereoMonoMode, StereoMonoOptions, StereoSplitMode } from "../../typings";
/**
 * Routes, mixes and delays the left and right channel of a signal.
 * Built from native Web Audio nodes, so it does not require WebAssembly.
 *
 *   input -> splitter -> 2x2 matrix -> per side delay -> merger -> output
 *
 * Modes (M = (L + R) / 2, S = (L - R) / 2):
 * - "stereo": (L, R), unchanged.
 * - "mono" / "mid": (M, M).
 * - "side": (S, -S). Only the stereo difference, which is what makes a signal sound wide.
 * - "swap": (R, L).
 * - "left": (L, 0) and "right": (0, R). Keeps one side in place and silences the other.
 * - "left-to-both": (L, L) and "right-to-both": (R, R).
 *
 * The modes are designed so a split can be merged back losslessly:
 * "left" + "right" = (L, R), and "mid" + "side" = (L, R).
 * Use {@link StereoMono.split} to split a channel into two branches, process each branch
 * differently, and merge them by sending both branches to the same channel.
 *
 * A short delay on one side (1 - 30 ms, the Haas effect) widens the image, and an inverted
 * polarity on one side makes a signal sound diffuse, which is the basis of pseudo surround.
 */
export declare class StereoMono extends Effector {
    name: string;
    label: string | null;
    mode: StereoMonoMode;
    delayLeftMs: number;
    delayRightMs: number;
    invertLeft: boolean;
    invertRight: boolean;
    inputGainNode: GainNode | null;
    mergerNode: ChannelMergerNode | null;
    private matrix;
    private delays;
    constructor(options?: Partial<StereoMonoOptions>);
    /**
     * Splits the signal of a channel into two new channels, each with a {@link StereoMono} effect as first effect.
     * The source channel keeps its other sends, so detach it from the master channel if only the branches should be heard.
     * Merge the branches by sending both to the same channel.
     *
     * - "left-right": the first branch carries (L, 0), the second (0, R).
     * - "mid-side": the first branch carries the mid (M, M), the second the side (S, -S).
     *
     * @example
     * ```
     * const [left, right] = StereoMono.split(source, "left-right");
     *
     * // Each branch can be processed on its own, for example a Haas delay on the right side.
     * (right.effects[0] as StereoMono).setDelayRight(15);
     *
     * left.send(merged);
     * right.send(merged);
     * ```
     */
    static split(source: Channel, mode?: StereoSplitMode): [Channel, Channel];
    initializeOnAttachment(context: AudioContext): Promise<void>;
    get inputNode(): AudioNode | null;
    get outputNode(): AudioNode | null;
    returnOptionsAsObject(): StereoMonoOptions;
    /**
     * Sets how the left and right channel are routed. The change is smoothed, so it does not click.
     */
    setMode(mode: StereoMonoMode): boolean;
    /**
     * Inverts the polarity of the left and/or right output.
     */
    setInvert(invertLeft: boolean, invertRight?: boolean): boolean;
    /**
     * Delays the left output (ms), between 0 and 100.
     */
    setDelayLeft(ms: number): boolean;
    /**
     * Delays the right output (ms), between 0 and 100.
     */
    setDelayRight(ms: number): boolean;
    private applyMatrix;
    /**
     * out L = ll * L + rl * R
     * out R = lr * L + rr * R
     */
    private matrixGains;
}
//# sourceMappingURL=StereoMono.d.ts.map