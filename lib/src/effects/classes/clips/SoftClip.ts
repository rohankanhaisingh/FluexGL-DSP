import { CoerceFiniteNumber, CreateAudioWorkletNode, SendMessageToWorklet } from "../../../utilities/helpers";
import { Effector } from "../../../core/classes/Effector";
import { SoftClipOptions, AudioWorkletProcessorNames, SoftClipMessageCommandId, StrictMode } from "../../../typings";

export class SoftClip extends Effector {

    public label: string | null = "SoftClip";
    public name: string = "SoftClip";

    public drive: number = 1;
    public gain: number = 1;
    public strictMode: StrictMode = StrictMode.Disabled;

    constructor({ drive, gain, strictMode }: Partial<SoftClipOptions>) {
        super();

        this.drive = Math.max(0, CoerceFiniteNumber(drive, this.drive));
        this.gain = Math.max(0, CoerceFiniteNumber(gain, this.gain));

        const mode = CoerceFiniteNumber(strictMode, this.strictMode);
        this.strictMode = mode === StrictMode.Enabled ? StrictMode.Enabled : StrictMode.Disabled;
    }

    public async InitializeOnAttachment(context: AudioContext): Promise<void> {
        this.context = context;
        this.audioWorkletNode = CreateAudioWorkletNode<SoftClipOptions>(context, AudioWorkletProcessorNames.SoftClip, this.ReturnOptionsAsObject());
    }

    public ReturnOptionsAsObject(): SoftClipOptions {
        return {
            drive: this.drive,
            gain: this.gain,
            strictMode: this.strictMode
        }
    }

    public SetDrive(drive: number): boolean {
        drive = Math.max(0, CoerceFiniteNumber(drive, this.drive));
        this.drive = drive;
        return SendMessageToWorklet<SoftClipMessageCommandId, number>(this.audioWorkletNode, SoftClipMessageCommandId.SetDrive, drive);
    }

    public SetGain(gain: number): boolean{
        gain = Math.max(0, CoerceFiniteNumber(gain, this.gain));
        this.gain = gain;
        return SendMessageToWorklet<SoftClipMessageCommandId, number>(this.audioWorkletNode, SoftClipMessageCommandId.SetGain, gain);
    }
}
