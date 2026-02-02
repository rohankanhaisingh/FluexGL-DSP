import { NotchFilterOptions } from "../../../typings";
import { Effector } from "../../../core/classes/Effector";
export default class NotchFilter extends Effector {
    name: string;
    constructor({ cutoff, q, minFrequency, strictMode }?: Partial<NotchFilterOptions>);
    InitializeOnAttachment(context: AudioContext): Promise<void>;
}
//# sourceMappingURL=NotchFilter.d.ts.map