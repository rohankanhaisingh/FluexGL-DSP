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
    initializeOnAttachment(context: AudioContext): Promise<void>;
    returnOptionsAsObject(): NotchFilterOptions;
    setCutoff(cutoff?: number): boolean;
    setMinFrequency(minFrequency?: number): boolean;
    setQ(q?: number): boolean;
}
//# sourceMappingURL=NotchFilter.d.ts.map