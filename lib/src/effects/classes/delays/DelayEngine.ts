import { Effector } from "../../../core/classes/Effector";
import { AdvancedDelayMessageCommandId, AdvancedDelayOptions, AudioWorkletProcessorNames, StrictMode } from "../../../typings";
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
} as const;

/** Parameters sent to the delay processor. */
export type DelayEngineParameters = Omit<AdvancedDelayOptions, "strictMode">;

export function clampDelayValue(key: keyof typeof DELAY_RANGES, value: unknown, fallback: number): number {
    const [min, max] = DELAY_RANGES[key];
    return Math.min(max, Math.max(min, coerceFiniteNumber(value, fallback)));
}

export function resolveStrictMode(value: unknown, fallback: StrictMode): StrictMode {
    return coerceFiniteNumber(value, fallback) === StrictMode.Enabled ? StrictMode.Enabled : StrictMode.Disabled;
}

/**
 * Shared base of MonoDelay, StereoDelay, PingPongDelay and AdvancedDelay.
 * All four run the same AdvancedDelay WASM engine in a different mode.
 */
export abstract class DelayEngine extends Effector {

    public strictMode: StrictMode = StrictMode.Disabled;

    protected abstract processorName: AudioWorkletProcessorNames;

    /** The full set of engine parameters this effect currently represents. */
    protected abstract engineParameters(): DelayEngineParameters;

    public async initializeOnAttachment(context: AudioContext): Promise<void> {

        if (this.context === context && this.audioWorkletNode) return;

        this.context = context;
        this.audioWorkletNode = createAudioWorkletNode(context, this.processorName, {
            ...this.engineParameters(),
            strictMode: this.strictMode
        });

        this.registerMessageEventListener(this.audioWorkletNode);
    }

    protected send(commandId: AdvancedDelayMessageCommandId, value: number): boolean {
        return sendMessageToWorklet<AdvancedDelayMessageCommandId, number>(this.audioWorkletNode, commandId, value);
    }
}
