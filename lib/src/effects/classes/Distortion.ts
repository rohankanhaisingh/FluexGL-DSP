import { Effector } from "../../core/classes/Effector";

export class Distortion extends Effector {

    static name: string = "Distortion";

    constructor() {
        super();
    }

    public async InitializeOnAttachment(parentialContext: AudioContext): Promise<void> {
        
    }
}