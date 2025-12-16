import { CreateAudioWorkletNode, SendMessageToWorklet } from "../../../utilities/helpers";
import { Effector } from "../../../core/classes/Effector";
import { SoftClipOptions, AudioWorkletProcessorNames, SoftClipMessageCommandId } from "../../../typings";

export class SoftClip extends Effector {

    public label: string | null = "SoftClip";
    public name: string = "SoftClip";

    public drive: number = 1;
    public gain: number = 1;

    constructor({ drive, gain }: Partial<SoftClipOptions>) {
        super();

        this.drive = drive ?? this.drive;
        this.gain = gain ?? this.gain;
    }

    public async InitializeOnAttachment(context: AudioContext): Promise<void> {
        this.context = context;
        this.audioWorkletNode = CreateAudioWorkletNode<SoftClipOptions>(context, AudioWorkletProcessorNames.SoftClip, this.ReturnOptionsAsObject());
    }

    public ReturnOptionsAsObject(): SoftClipOptions {
        return {
            drive: this.drive,
            gain: this.gain
        }
    }

    public SetDrive(drive: number): boolean {
        this.drive = drive;
        return SendMessageToWorklet<SoftClipMessageCommandId, number>(this.audioWorkletNode, SoftClipMessageCommandId.SetDrive, drive);
    }

    public SetGain(gain: number): boolean{
        this.gain = gain;
        return SendMessageToWorklet<SoftClipMessageCommandId, number>(this.audioWorkletNode, SoftClipMessageCommandId.SetGain, gain);
    }
}