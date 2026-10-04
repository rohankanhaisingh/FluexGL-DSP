import { Effector } from "../../core/classes/Effector";
import { SaturationMode, SaturationOptions, StrictMode } from "../../typings";
/**
 * Analog-style saturation, processed in WebAssembly with antiderivative anti-aliasing (ADAA),
 * which strongly reduces the harsh aliasing of plain waveshaping.
 *
 * - "soft": smooth, symmetric (tanh). Odd harmonics.
 * - "tube": asymmetric. Adds even harmonics, sounds warmer. A DC blocker removes the offset.
 * - "tape": gentle knee. Compresses gradually.
 *
 * The saturated signal is scaled by 1 / sqrt(drive), so raising the drive adds character
 * without making the sound much louder. Use outputGain to fine-tune the level.
 */
export declare class Saturation extends Effector {
    name: string;
    label: string | null;
    drive: number;
    mode: SaturationMode;
    tone: number;
    mix: number;
    outputGain: number;
    strictMode: StrictMode;
    constructor(options?: Partial<SaturationOptions>);
    initializeOnAttachment(context: AudioContext): Promise<void>;
    returnOptionsAsObject(): SaturationOptions;
    setDrive(drive: number): boolean;
    setMode(mode: SaturationMode): boolean;
    /**
     * Sets the lowpass after the curve (Hz). 0 disables it.
     */
    setTone(tone: number): boolean;
    setMix(mix: number): boolean;
    setOutputGain(outputGain: number): boolean;
    private send;
}
//# sourceMappingURL=Saturation.d.ts.map