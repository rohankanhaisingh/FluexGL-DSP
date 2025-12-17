import { Effector } from "../../../core/classes/Effector";
import { CoerceFiniteNumber, CreateAudioWorkletNode, SendMessageToWorklet } from "../../../utilities/helpers";
import { HardClipMessageCommandId, AudioWorkletProcessorNames, StrictMode } from "../../../typings";
export class HardClip extends Effector {
    label = "HardClip";
    name = "HardClip";
    drive = 1;
    gain = 1;
    strictMode = StrictMode.Disabled;
    constructor({ drive, gain, strictMode }) {
        super();
        this.drive = Math.max(0, CoerceFiniteNumber(drive, this.drive));
        this.gain = Math.max(0, CoerceFiniteNumber(gain, this.gain));
        const mode = CoerceFiniteNumber(strictMode, this.strictMode);
        this.strictMode = mode === StrictMode.Enabled ? StrictMode.Enabled : StrictMode.Disabled;
    }
    async InitializeOnAttachment(context) {
        this.context = context;
        this.audioWorkletNode = CreateAudioWorkletNode(context, AudioWorkletProcessorNames.HardClip, this.ReturnOptionsAsObject());
    }
    ReturnOptionsAsObject() {
        return {
            drive: this.drive,
            gain: this.gain,
            strictMode: this.strictMode
        };
    }
    SetDrive(drive) {
        drive = Math.max(0, CoerceFiniteNumber(drive, this.drive));
        this.drive = drive;
        return SendMessageToWorklet(this.audioWorkletNode, HardClipMessageCommandId.SetDrive, drive);
    }
    SetGain(gain) {
        gain = Math.max(0, CoerceFiniteNumber(gain, this.gain));
        this.gain = gain;
        return SendMessageToWorklet(this.audioWorkletNode, HardClipMessageCommandId.SetGain, gain);
    }
}
