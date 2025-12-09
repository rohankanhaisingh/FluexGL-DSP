import { Effector } from "../../../core/classes/Effector";
import { SoftClipOptions } from "../../../typings";
export declare class SoftClip extends Effector {
    label: string | null;
    name: string;
    drive: number;
    gain: number;
    constructor({ drive, gain }: Partial<SoftClipOptions>);
    InitializeOnAttachment(parentialContext: AudioContext): Promise<void>;
    ReturnOptionsAsObject(): SoftClipOptions;
    SetDrive(drive: number): boolean;
    SetGain(gain: number): boolean;
}
//# sourceMappingURL=SoftClip.d.ts.map