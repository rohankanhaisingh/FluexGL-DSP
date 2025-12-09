import { Effector } from "../../core/classes/Effector";
import { ChorusEffectOptions } from "../../typings";
export declare class Chorus extends Effector {
    label: string | null;
    name: string;
    baseDelayMs: number;
    depthMs: number;
    rateHz: number;
    mix: number;
    feedback: number;
    constructor({ baseDelayMs, depthMs, rateHz, mix, feedback }: Partial<ChorusEffectOptions>);
    InitializeOnAttachment(parentialContext: AudioContext): Promise<void>;
    ReturnOptionsAsObject(): ChorusEffectOptions;
    SetBaseDelayMs(value: number): boolean;
    SetDepthMs(value: number): boolean;
    SetRateHz(value: number): boolean;
    SetMix(value: number): boolean;
    SetFeedback(value: number): boolean;
}
//# sourceMappingURL=Chorus.d.ts.map