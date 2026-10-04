import { Effector } from "../../../core/classes/Effector";
import { StrictMode } from "../../../typings";
import { coerceFiniteNumber, createAudioWorkletNode, sendMessageToWorklet } from "../../../utilities/helpers";
/** Valid ranges, matching the AdvancedDelay WASM engine. */
export const DELAY_RANGES = {
    delayMs: [1, 4000],
    feedback: [0, 0.98],
    crossFeedback: [0, 1],
    mix: [0, 1],
    lowCut: [0, 2000],
    highCut: [0, 24000],
    modulationRate: [0, 10],
    modulationDepth: [0, 20],
    drive: [0, 1]
};
export function clampDelayValue(key, value, fallback) {
    const [min, max] = DELAY_RANGES[key];
    return Math.min(max, Math.max(min, coerceFiniteNumber(value, fallback)));
}
export function resolveStrictMode(value, fallback) {
    return coerceFiniteNumber(value, fallback) === StrictMode.Enabled ? StrictMode.Enabled : StrictMode.Disabled;
}
/**
 * Shared base of MonoDelay, StereoDelay, PingPongDelay and AdvancedDelay.
 * All four run the same AdvancedDelay WASM engine in a different mode.
 */
export class DelayEngine extends Effector {
    strictMode = StrictMode.Disabled;
    async initializeOnAttachment(context) {
        if (this.context === context && this.audioWorkletNode)
            return;
        this.context = context;
        this.audioWorkletNode = createAudioWorkletNode(context, this.processorName, {
            ...this.engineParameters(),
            strictMode: this.strictMode
        });
        this.registerMessageEventListener(this.audioWorkletNode);
    }
    send(commandId, value) {
        return sendMessageToWorklet(this.audioWorkletNode, commandId, value);
    }
}
