import { NotchFilterOptions } from "../../../typings";
import { Effector } from "../../../core/classes/Effector";

export default class NotchFilter extends Effector {
    
    public name: string = "NotchFilter";

    constructor({ cutoff, q, minFrequency, strictMode }: Partial<NotchFilterOptions> = {}) {
        super();
    }

    public async InitializeOnAttachment(context: AudioContext): Promise<void> {
        return;
    }
}
