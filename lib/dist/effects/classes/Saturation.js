import { Effector } from "../../core/classes/Effector";
import { AudioWorkletProcessorNames, SaturationMessageCommandId, StrictMode } from "../../typings";
import { coerceFiniteNumber, createAudioWorkletNode, sendMessageToWorklet } from "../../utilities/helpers";
/** Mode ids, matching the Saturation WASM struct. */
const MODE_IDS = {
    soft: 0,
    tube: 1,
    tape: 2
};
function clamp(value, min, max) {
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
    name = "Saturation";
    label = "Saturation";
    drive = 12;
    mode = "soft";
    tone = 0;
    mix = 1;
    outputGain = 0;
    strictMode = StrictMode.Disabled;
    constructor(options) {
        super();
        this.drive = clamp(coerceFiniteNumber(options?.drive, this.drive), 0, 48);
        this.mode = options?.mode && options.mode in MODE_IDS ? options.mode : this.mode;
        this.tone = clamp(coerceFiniteNumber(options?.tone, this.tone), 0, 24000);
        this.mix = clamp(coerceFiniteNumber(options?.mix, this.mix), 0, 1);
        this.outputGain = clamp(coerceFiniteNumber(options?.outputGain, this.outputGain), -24, 24);
        this.strictMode = coerceFiniteNumber(options?.strictMode, this.strictMode) === StrictMode.Enabled ? StrictMode.Enabled : StrictMode.Disabled;
    }
    async initializeOnAttachment(context) {
        if (this.context === context && this.audioWorkletNode)
            return;
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
    returnOptionsAsObject() {
        return {
            drive: this.drive,
            mode: this.mode,
            tone: this.tone,
            mix: this.mix,
            outputGain: this.outputGain,
            strictMode: this.strictMode
        };
    }
    setDrive(drive) {
        this.drive = clamp(coerceFiniteNumber(drive, this.drive), 0, 48);
        return this.send(SaturationMessageCommandId.SetDrive, this.drive);
    }
    setMode(mode) {
        if (!(mode in MODE_IDS))
            return false;
        this.mode = mode;
        return this.send(SaturationMessageCommandId.SetMode, MODE_IDS[mode]);
    }
    /**
     * Sets the lowpass after the curve (Hz). 0 disables it.
     */
    setTone(tone) {
        this.tone = clamp(coerceFiniteNumber(tone, this.tone), 0, 24000);
        return this.send(SaturationMessageCommandId.SetTone, this.tone);
    }
    setMix(mix) {
        this.mix = clamp(coerceFiniteNumber(mix, this.mix), 0, 1);
        return this.send(SaturationMessageCommandId.SetMix, this.mix);
    }
    setOutputGain(outputGain) {
        this.outputGain = clamp(coerceFiniteNumber(outputGain, this.outputGain), -24, 24);
        return this.send(SaturationMessageCommandId.SetOutputGain, this.outputGain);
    }
    send(commandId, value) {
        return sendMessageToWorklet(this.audioWorkletNode, commandId, value);
    }
}
