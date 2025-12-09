import { Effector } from "../../../core/classes/Effector";
import { LowPassFilterOptions } from "../../../typings";
export declare class LowPassFilter extends Effector {
    name: string;
    label: string | null;
    cutoff: number;
    minFrequency: number;
    constructor({ cutoff, minFrequency }: Partial<LowPassFilterOptions>);
    InitializeOnAttachment(parentialContext: AudioContext): Promise<void>;
    ReturnOptionsAsObject(): LowPassFilterOptions;
    SetCutoff(cutoff?: number): boolean;
    SetMinFrequency(minFrequency?: number): boolean;
}
//# sourceMappingURL=LowPassFilter.d.ts.map