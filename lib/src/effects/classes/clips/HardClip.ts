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

    public async InitializeOnAttachment(parentialContext: AudioContext): Promise<void> {
        this.parentialContext = parentialContext;
        this.audioWorkletNode = CreateAudioWorkletNode<HardClipOptions>(parentialContext, AudioWorkletProcessorNames.HardClip, this.ReturnOptionsAsObject());
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