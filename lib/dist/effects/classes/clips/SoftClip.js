import { CreateAudioWorkletNode, SendMessageToWorklet } from "../../../utilities/helpers";
import { Effector } from "../../../core/classes/Effector";
import { AudioWorkletProcessorNames, SoftClipMessageCommandId } from "../../../typings";
export class SoftClip extends Effector {
    label = "SoftClip";
    name = "SoftClip";
    drive = 1;
    gain = 1;
    constructor({ drive, gain }) {
        super();
        this.drive = drive ?? this.drive;
        this.gain = gain ?? this.gain;
    }
    async InitializeOnAttachment(parentialContext) {
        this.parentialContext = parentialContext;
        this.audioWorkletNode = CreateAudioWorkletNode(parentialContext, AudioWorkletProcessorNames.SoftClip, this.ReturnOptionsAsObject());
    }
    ReturnOptionsAsObject() {
        return {
            drive: this.drive,
            gain: this.gain
        };
    }
    SetDrive(drive) {
        this.drive = drive;
        return SendMessageToWorklet(this.audioWorkletNode, SoftClipMessageCommandId.SetDrive, drive);
    }
    SetGain(gain) {
        this.gain = gain;
        return SendMessageToWorklet(this.audioWorkletNode, SoftClipMessageCommandId.SetGain, gain);
    }
}
