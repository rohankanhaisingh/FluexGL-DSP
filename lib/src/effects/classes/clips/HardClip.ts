import { Effector } from "../../../core/classes/Effector";
import { CreateAudioWorkletNode, SendMessageToWorklet } from "../../../utilities/helpers";
import { HardClipMessageCommandId, AudioWorkletProcessorNames, HardClipOptions } from "../../../typings";

export class HardClip extends Effector {

    public label: string | null = "HardClip";
    public name: string = "HardClip";

    public drive: number = 1;
    public gain: number = 1;

    constructor({ drive, gain }: Partial<HardClipOptions>) {
        super();

        this.drive = drive ?? this.drive;
        this.gain = gain ?? this.gain;
    }

    public async InitializeOnAttachment(context: AudioContext): Promise<void> {
        this.context = context;
        this.audioWorkletNode = CreateAudioWorkletNode<HardClipOptions>(context, AudioWorkletProcessorNames.HardClip, this.ReturnOptionsAsObject());
    }

    public ReturnOptionsAsObject(): HardClipOptions {
        return {
            drive: this.drive,
            gain: this.gain
        }
    }

     public SetDrive(drive: number): boolean {
        this.drive = drive;
        return SendMessageToWorklet<HardClipMessageCommandId, number>(this.audioWorkletNode, HardClipMessageCommandId.SetDrive, drive);
    }

    public SetGain(gain: number): boolean{
        this.gain = gain;
        return SendMessageToWorklet<HardClipMessageCommandId, number>(this.audioWorkletNode, HardClipMessageCommandId.SetGain, gain);
    }
}