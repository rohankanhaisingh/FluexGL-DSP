import { coerceFiniteNumber, createAudioWorkletNode, sendMessageToWorklet } from "../../../utilities/helpers";
import { Effector } from "../../../core/classes/Effector";
import { AudioWorkletProcessorNames, SoftClipMessageCommandId, StrictMode } from "../../../typings";
export class SoftClip extends Effector {
    label = "SoftClip";
    name = "SoftClip";
    drive = 1;
    gain = 1;
    strictMode = StrictMode.Disabled;
    constructor({ drive, gain, strictMode } = {}) {
        super();
        this.drive = Math.max(0, coerceFiniteNumber(drive, this.drive));
        this.gain = Math.max(0, coerceFiniteNumber(gain, this.gain));
        const mode = coerceFiniteNumber(strictMode, this.strictMode);
        this.strictMode = mode === StrictMode.Enabled ? StrictMode.Enabled : StrictMode.Disabled;
    }
    async initializeOnAttachment(context) {
        if (this.context === null)
            this.context = context;
        if (this.audioWorkletNode === null)
            this.audioWorkletNode = createAudioWorkletNode(context, AudioWorkletProcessorNames.SoftClip, this.returnOptionsAsObject());
    }
    returnOptionsAsObject() {
        return {
            drive: this.drive,
            gain: this.gain,
            strictMode: this.strictMode
        };
    }
    setDrive(drive) {
        drive = Math.max(0, coerceFiniteNumber(drive, this.drive));
        this.drive = drive;
        return sendMessageToWorklet(this.audioWorkletNode, SoftClipMessageCommandId.SetDrive, drive);
    }
    setGain(gain) {
        gain = Math.max(0, coerceFiniteNumber(gain, this.gain));
        this.gain = gain;
        return sendMessageToWorklet(this.audioWorkletNode, SoftClipMessageCommandId.SetGain, gain);
    }
}
