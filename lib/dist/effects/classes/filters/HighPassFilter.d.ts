import { Effector } from "../../../core/classes/Effector";
import { HighPassFilterOptions, StrictMode } from "../../../typings";
export declare class HighPassFilter extends Effector {
    name: string;
    label: string | null;
    cutoff: number;
    q: number;
    strictMode: StrictMode;
    maxFrequency: number;
    private contextSampleRate;
    constructor({ cutoff, q, strictMode }?: Partial<HighPassFilterOptions>);
    InitializeOnAttachment(context: AudioContext): Promise<void>;
    ReturnOptionsAsObject(): HighPassFilterOptions;
    SetCutoff(cutoff?: number): boolean;
    SetMaxFrequency(maxFrequency?: number): boolean;
    SetQ(q?: number): boolean;
}
//# sourceMappingURL=HighPassFilter.d.ts.map