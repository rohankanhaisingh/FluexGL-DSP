import { Effector } from "../../../core/classes/Effector";
import { LowPassFilterOptions, StrictMode } from "../../../typings";
export declare class LowPassFilter extends Effector {
    name: string;
    label: string | null;
    cutoff: number;
    q: number;
    minFrequency: number;
    strictMode: StrictMode;
    constructor({ cutoff, minFrequency, q, strictMode }: Partial<LowPassFilterOptions>);
    InitializeOnAttachment(context: AudioContext): Promise<void>;
    ReturnOptionsAsObject(): LowPassFilterOptions;
    SetCutoff(cutoff?: number): boolean;
    SetMinFrequency(minFrequency?: number): boolean;
    SetQ(q?: number): boolean;
}
//# sourceMappingURL=LowPassFilter.d.ts.map