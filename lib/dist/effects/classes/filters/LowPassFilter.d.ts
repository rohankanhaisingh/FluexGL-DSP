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
    initializeOnAttachment(context: AudioContext): Promise<void>;
    returnOptionsAsObject(): LowPassFilterOptions;
    setCutoff(cutoff?: number): boolean;
    setMinFrequency(minFrequency?: number): boolean;
    setQ(q?: number): boolean;
}
//# sourceMappingURL=LowPassFilter.d.ts.map