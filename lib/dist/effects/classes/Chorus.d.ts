import { Effector } from "../../core/classes/Effector";
import { ChorusEffectOptions, StrictMode } from "../../typings";
export declare class Chorus extends Effector {
    label: string | null;
    name: string;
    baseDelayMs: number;
    depthMs: number;
    rateHz: number;
    mix: number;
    feedback: number;
    strictMode: StrictMode;
    constructor({ baseDelayMs, depthMs, rateHz, mix, feedback, strictMode }: Partial<ChorusEffectOptions>);
    initializeOnAttachment(context: AudioContext): Promise<void>;
    returnOptionsAsObject(): ChorusEffectOptions;
    setBaseDelayMs(value: number): boolean;
    setDepthMs(value: number): boolean;
    setRateHz(value: number): boolean;
    setMix(value: number): boolean;
    setFeedback(value: number): boolean;
}
//# sourceMappingURL=Chorus.d.ts.map