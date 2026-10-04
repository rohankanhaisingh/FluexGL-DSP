import { Effector } from "../../core/classes/Effector";
import { AudioWorkletProcessorNames, SaturationMessageCommandId, SaturationMode, SaturationOptions, StrictMode } from "../../typings";
import { coerceFiniteNumber, createAudioWorkletNode, sendMessageToWorklet } from "../../utilities/helpers";

/** Mode ids, matching the Saturation WASM struct. */
const MODE_IDS: Record<SaturationMode, number> = {
    soft: 0,
    tube: 1,
    tape: 2
};

function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}

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
export class Saturation extends Effector {

    public name: string = "Saturation";
    public label: string | null = "Saturation";

    public drive: number = 12;
    public mode: SaturationMode = "soft";
    public tone: number = 0;
    public mix: number = 1;
    public outputGain: number = 0;
    public strictMode: StrictMode = StrictMode.Disabled;

    constructor(options?: Partial<SaturationOptions>) {
        super();

        this.drive = clamp(coerceFiniteNumber(options?.drive, this.drive), 0, 48);
        this.mode = options?.mode && options.mode in MODE_IDS ? options.mode : this.mode;
        this.tone = clamp(coerceFiniteNumber(options?.tone, this.tone), 0, 24000);
        this.mix = clamp(coerceFiniteNumber(options?.mix, this.mix), 0, 1);
        this.outputGain = clamp(coerceFiniteNumber(options?.outputGain, this.outputGain), -24, 24);
        this.strictMode = coerceFiniteNumber(options?.strictMode, this.strictMode) === StrictMode.Enabled ? StrictMode.Enabled : StrictMode.Disabled;
    }

    public async initializeOnAttachment(context: AudioContext): Promise<void> {

        if (this.context === context && this.audioWorkletNode) return;

        this.context = context;
        this.audioWorkletNode = createAudioWorkletNode(context, AudioWorkletProcessorNames.Saturation, {
            drive: this.drive,
            mode: MODE_IDS[this.mode],
            tone: this.tone,
            mix: this.mix,
            outputGain: this.outputGain,
            strictMode: this.strictMode
        });

        this.registerMessageEventListener(this.audioWorkletNode);
    }

    public returnOptionsAsObject(): SaturationOptions {
        return {
            drive: this.drive,
            mode: this.mode,
            tone: this.tone,
            mix: this.mix,
            outputGain: this.outputGain,
            strictMode: this.strictMode
        }
    }

    public setDrive(drive: number): boolean {
        this.drive = clamp(coerceFiniteNumber(drive, this.drive), 0, 48);
        return this.send(SaturationMessageCommandId.SetDrive, this.drive);
    }

    public setMode(mode: SaturationMode): boolean {

        if (!(mode in MODE_IDS)) return false;

        this.mode = mode;
        return this.send(SaturationMessageCommandId.SetMode, MODE_IDS[mode]);
    }

    /**
     * Sets the lowpass after the curve (Hz). 0 disables it.
     */
    public setTone(tone: number): boolean {
        this.tone = clamp(coerceFiniteNumber(tone, this.tone), 0, 24000);
        return this.send(SaturationMessageCommandId.SetTone, this.tone);
    }

    public setMix(mix: number): boolean {
        this.mix = clamp(coerceFiniteNumber(mix, this.mix), 0, 1);
        return this.send(SaturationMessageCommandId.SetMix, this.mix);
    }

    public setOutputGain(outputGain: number): boolean {
        this.outputGain = clamp(coerceFiniteNumber(outputGain, this.outputGain), -24, 24);
        return this.send(SaturationMessageCommandId.SetOutputGain, this.outputGain);
    }

    private send(commandId: SaturationMessageCommandId, value: number): boolean {
        return sendMessageToWorklet<SaturationMessageCommandId, number>(this.audioWorkletNode, commandId, value);
    }
}
