import { Effector } from "../../core/classes/Effector";

export class Distortion extends Effector {

    public name: string = "Distortion";

    constructor() {
        super();
    }

    public async initializeOnAttachment(parentialContext: AudioContext): Promise<void> {
        
    }
}