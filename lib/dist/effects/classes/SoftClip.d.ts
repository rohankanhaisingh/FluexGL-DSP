import { Effector } from "../../core/classes/Effector";
export declare class SoftClip extends Effector {
    drive: number;
    label: string | null;
    name: string;
    constructor(drive?: number);
    InitializeOnAttachment(parentialContext: AudioContext): Promise<void>;
    SetDrive(drive: number): SoftClip;
}
//# sourceMappingURL=SoftClip.d.ts.map