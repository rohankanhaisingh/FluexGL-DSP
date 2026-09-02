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
    initializeOnAttachment(context: AudioContext): Promise<void>;
    returnOptionsAsObject(): HighPassFilterOptions;
    setCutoff(cutoff?: number): boolean;
    setMaxFrequency(maxFrequency?: number): boolean;
    setQ(q?: number): boolean;
}
//# sourceMappingURL=HighPassFilter.d.ts.map