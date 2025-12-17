import { Effector } from "../../../core/classes/Effector";
import { HardClipOptions, StrictMode } from "../../../typings";
export declare class HardClip extends Effector {
    label: string | null;
    name: string;
    drive: number;
    gain: number;
    strictMode: StrictMode;
    constructor({ drive, gain, strictMode }: Partial<HardClipOptions>);
    InitializeOnAttachment(context: AudioContext): Promise<void>;
    ReturnOptionsAsObject(): HardClipOptions;
    SetDrive(drive: number): boolean;
    SetGain(gain: number): boolean;
}
//# sourceMappingURL=HardClip.d.ts.map