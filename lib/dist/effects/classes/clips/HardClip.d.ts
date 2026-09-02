import { Effector } from "../../../core/classes/Effector";
import { HardClipOptions, StrictMode } from "../../../typings";
export declare class HardClip extends Effector {
    label: string | null;
    name: string;
    drive: number;
    gain: number;
    strictMode: StrictMode;
    constructor({ drive, gain, strictMode }: Partial<HardClipOptions>);
    initializeOnAttachment(context: AudioContext): Promise<void>;
    returnOptionsAsObject(): HardClipOptions;
    setDrive(drive: number): boolean;
    setGain(gain: number): boolean;
}
//# sourceMappingURL=HardClip.d.ts.map