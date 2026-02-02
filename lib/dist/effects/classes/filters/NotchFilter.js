import { Effector } from "../../../core/classes/Effector";
export default class NotchFilter extends Effector {
    name = "NotchFilter";
    constructor({ cutoff, q, minFrequency, strictMode } = {}) {
        super();
    }
    async InitializeOnAttachment(context) {
        return;
    }
}
