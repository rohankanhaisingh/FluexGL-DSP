import { Effector } from "../../../core/classes/Effector";
import { CreateAudioWorkletNode, SendMessageToWorklet } from "../../../utilities/helpers";
import { HardClipMessageCommandId, AudioWorkletProcessorNames } from "../../../typings";
export class HardClip extends Effector {
    label = "HardClip";
    name = "HardClip";
    drive = 1;
    gain = 1;
    constructor({ drive, gain }) {
        super();
        this.drive = drive ?? this.drive;
        this.gain = gain ?? this.gain;
    }
    async InitializeOnAttachment(context) {
        this.context = context;
        this.audioWorkletNode = CreateAudioWorkletNode(context, AudioWorkletProcessorNames.HardClip, this.ReturnOptionsAsObject());
    }
    ReturnOptionsAsObject() {
        return {
            drive: this.drive,
            gain: this.gain
        };
    }
    SetDrive(drive) {
        this.drive = drive;
        return SendMessageToWorklet(this.audioWorkletNode, HardClipMessageCommandId.SetDrive, drive);
    }
    SetGain(gain) {
        this.gain = gain;
        return SendMessageToWorklet(this.audioWorkletNode, HardClipMessageCommandId.SetGain, gain);
    }
}
