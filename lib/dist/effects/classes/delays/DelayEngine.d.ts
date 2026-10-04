import { Effector } from "../../../core/classes/Effector";
import { AdvancedDelayMessageCommandId, AdvancedDelayOptions, AudioWorkletProcessorNames, StrictMode } from "../../../typings";
/** Valid ranges, matching the AdvancedDelay WASM engine. */
export declare const DELAY_RANGES: {
    readonly delayMs: readonly [1, 4000];
    readonly feedback: readonly [0, 0.98];
    readonly crossFeedback: readonly [0, 1];
    readonly mix: readonly [0, 1];
    readonly lowCut: readonly [0, 2000];
    readonly highCut: readonly [0, 24000];
    readonly modulationRate: readonly [0, 10];
    readonly modulationDepth: readonly [0, 20];
    readonly drive: readonly [0, 1];
};
/** Parameters sent to the delay processor. */
export type DelayEngineParameters = Omit<AdvancedDelayOptions, "strictMode">;
export declare function clampDelayValue(key: keyof typeof DELAY_RANGES, value: unknown, fallback: number): number;
export declare function resolveStrictMode(value: unknown, fallback: StrictMode): StrictMode;
/**
 * Shared base of MonoDelay, StereoDelay, PingPongDelay and AdvancedDelay.
 * All four run the same AdvancedDelay WASM engine in a different mode.
 */
export declare abstract class DelayEngine extends Effector {
    strictMode: StrictMode;
    protected abstract processorName: AudioWorkletProcessorNames;
    /** The full set of engine parameters this effect currently represents. */
    protected abstract engineParameters(): DelayEngineParameters;
    initializeOnAttachment(context: AudioContext): Promise<void>;
    protected send(commandId: AdvancedDelayMessageCommandId, value: number): boolean;
}
//# sourceMappingURL=DelayEngine.d.ts.map