import { NotchFilterOptions } from "../../../typings";
import { Effector } from "../../../core/classes/Effector";
export default class NotchFilter extends Effector {
    name: string;
    label: string | null;
    cutoff: number;
    minFrequency: number;
    q: number;
    private contextSampleRate;
    private strictMode;
    constructor({ cutoff, q, minFrequency, strictMode }?: Partial<NotchFilterOptions>);
    InitializeOnAttachment(context: AudioContext): Promise<void>;
    ReturnOptionsAsObject(): NotchFilterOptions;
    SetCutoff(cutoff?: number): boolean;
    SetMinFrequency(minFrequency?: number): boolean;
    SetQ(q?: number): boolean;
}
//# sourceMappingURL=NotchFilter.d.ts.map