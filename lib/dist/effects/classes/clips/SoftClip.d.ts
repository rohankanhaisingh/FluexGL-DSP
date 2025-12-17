import { Effector } from "../../../core/classes/Effector";
import { SoftClipOptions, StrictMode } from "../../../typings";
export declare class SoftClip extends Effector {
    label: string | null;
    name: string;
    drive: number;
    gain: number;
    strictMode: StrictMode;
    constructor({ drive, gain, strictMode }: Partial<SoftClipOptions>);
    InitializeOnAttachment(context: AudioContext): Promise<void>;
    ReturnOptionsAsObject(): SoftClipOptions;
    SetDrive(drive: number): boolean;
    SetGain(gain: number): boolean;
}
//# sourceMappingURL=SoftClip.d.ts.map