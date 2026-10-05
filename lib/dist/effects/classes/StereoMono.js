import { Effector } from "../../core/classes/Effector";
import { Channel } from "../../core/classes/Channel";
const MAX_DELAY_MS = 100;
/** Matrix gains per mode: [left-to-left, right-to-left, left-to-right, right-to-right]. */
const MODE_MATRIX = {
    "stereo": [1, 0, 0, 1],
    "mono": [0.5, 0.5, 0.5, 0.5],
    "swap": [0, 1, 1, 0],
    "left": [1, 0, 0, 0],
    "right": [0, 0, 0, 1],
    "left-to-both": [1, 0, 1, 0],
    "right-to-both": [0, 1, 0, 1],
    "mid": [0.5, 0.5, 0.5, 0.5],
    "side": [0.5, -0.5, -0.5, 0.5]
};
function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}
function finiteOr(value, fallback) {
    return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}
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
export class StereoMono extends Effector {
    name = "StereoMono";
    label = "StereoMono";
    mode = "stereo";
    delayLeftMs = 0;
    delayRightMs = 0;
    invertLeft = false;
    invertRight = false;
    inputGainNode = null;
    mergerNode = null;
    matrix = null;
    delays = null;
    constructor(options) {
        super();
        if (options?.mode && options.mode in MODE_MATRIX)
            this.mode = options.mode;
        this.delayLeftMs = clamp(finiteOr(options?.delayLeftMs, this.delayLeftMs), 0, MAX_DELAY_MS);
        this.delayRightMs = clamp(finiteOr(options?.delayRightMs, this.delayRightMs), 0, MAX_DELAY_MS);
        this.invertLeft = options?.invertLeft ?? this.invertLeft;
        this.invertRight = options?.invertRight ?? this.invertRight;
    }
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
    static split(source, mode = "left-right") {
        if (!source.context)
            throw new Error(`Could not split channel (${source.id}), because the channel's AudioContext is undefined.`);
        const [modeA, modeB] = mode === "mid-side" ? ["mid", "side"] : ["left", "right"];
        const [suffixA, suffixB] = mode === "mid-side" ? ["Mid", "Side"] : ["L", "R"];
        const branchA = new Channel(source.context, `${source.label} ${suffixA}`);
        const branchB = new Channel(source.context, `${source.label} ${suffixB}`);
        branchA.attachEffect(new StereoMono({ mode: modeA }));
        branchB.attachEffect(new StereoMono({ mode: modeB }));
        source.send(branchA);
        source.send(branchB);
        return [branchA, branchB];
    }
    async initializeOnAttachment(context) {
        if (this.context === context && this.inputGainNode && this.mergerNode)
            return;
        this.context = context;
        // Explicit stereo, so a mono input is upmixed to both channels.
        this.inputGainNode = new GainNode(context, { channelCount: 2, channelCountMode: "explicit", channelInterpretation: "speakers" });
        const splitter = new ChannelSplitterNode(context, { numberOfOutputs: 2 });
        const [ll, rl, lr, rr] = this.matrixGains();
        this.matrix = {
            ll: new GainNode(context, { gain: ll }),
            rl: new GainNode(context, { gain: rl }),
            lr: new GainNode(context, { gain: lr }),
            rr: new GainNode(context, { gain: rr })
        };
        this.delays = {
            left: new DelayNode(context, { maxDelayTime: MAX_DELAY_MS / 1000, delayTime: this.delayLeftMs / 1000 }),
            right: new DelayNode(context, { maxDelayTime: MAX_DELAY_MS / 1000, delayTime: this.delayRightMs / 1000 })
        };
        this.mergerNode = new ChannelMergerNode(context, { numberOfInputs: 2 });
        this.inputGainNode.connect(splitter);
        splitter.connect(this.matrix.ll, 0).connect(this.delays.left);
        splitter.connect(this.matrix.rl, 1).connect(this.delays.left);
        splitter.connect(this.matrix.lr, 0).connect(this.delays.right);
        splitter.connect(this.matrix.rr, 1).connect(this.delays.right);
        this.delays.left.connect(this.mergerNode, 0, 0);
        this.delays.right.connect(this.mergerNode, 0, 1);
    }
    get inputNode() {
        return this.inputGainNode;
    }
    get outputNode() {
        return this.mergerNode;
    }
    returnOptionsAsObject() {
        return {
            mode: this.mode,
            delayLeftMs: this.delayLeftMs,
            delayRightMs: this.delayRightMs,
            invertLeft: this.invertLeft,
            invertRight: this.invertRight
        };
    }
    /**
     * Sets how the left and right channel are routed. The change is smoothed, so it does not click.
     */
    setMode(mode) {
        if (!(mode in MODE_MATRIX))
            return false;
        this.mode = mode;
        return this.applyMatrix();
    }
    /**
     * Inverts the polarity of the left and/or right output.
     */
    setInvert(invertLeft, invertRight = this.invertRight) {
        this.invertLeft = invertLeft;
        this.invertRight = invertRight;
        return this.applyMatrix();
    }
    /**
     * Delays the left output (ms), between 0 and 100.
     */
    setDelayLeft(ms) {
        this.delayLeftMs = clamp(finiteOr(ms, this.delayLeftMs), 0, MAX_DELAY_MS);
        if (!this.delays || !this.context)
            return false;
        this.delays.left.delayTime.setTargetAtTime(this.delayLeftMs / 1000, this.context.currentTime, 0.01);
        return true;
    }
    /**
     * Delays the right output (ms), between 0 and 100.
     */
    setDelayRight(ms) {
        this.delayRightMs = clamp(finiteOr(ms, this.delayRightMs), 0, MAX_DELAY_MS);
        if (!this.delays || !this.context)
            return false;
        this.delays.right.delayTime.setTargetAtTime(this.delayRightMs / 1000, this.context.currentTime, 0.01);
        return true;
    }
    applyMatrix() {
        if (!this.matrix || !this.context)
            return false;
        const [ll, rl, lr, rr] = this.matrixGains();
        const now = this.context.currentTime;
        this.matrix.ll.gain.setTargetAtTime(ll, now, 0.01);
        this.matrix.rl.gain.setTargetAtTime(rl, now, 0.01);
        this.matrix.lr.gain.setTargetAtTime(lr, now, 0.01);
        this.matrix.rr.gain.setTargetAtTime(rr, now, 0.01);
        return true;
    }
    /**
     * out L = ll * L + rl * R
     * out R = lr * L + rr * R
     */
    matrixGains() {
        const [ll, rl, lr, rr] = MODE_MATRIX[this.mode];
        const left = this.invertLeft ? -1 : 1;
        const right = this.invertRight ? -1 : 1;
        return [ll * left, rl * left, lr * right, rr * right];
    }
}
