import { Effector } from "../../../core/classes/Effector";
import { CoerceFiniteNumber, CreateAudioWorkletNode, SendMessageToWorklet } from "../../../utilities/helpers";
import { HardClipMessageCommandId, AudioWorkletProcessorNames, HardClipOptions, StrictMode } from "../../../typings";

export class HardClip extends Effector {

    public label: string | null = "HardClip";
    public name: string = "HardClip";

    public drive: number = 1;
    public gain: number = 1;
    public strictMode: StrictMode = StrictMode.Disabled;

    constructor({ drive, gain, strictMode }: Partial<HardClipOptions>) {
        super();

        this.drive = Math.max(0, CoerceFiniteNumber(drive, this.drive));
        this.gain = Math.max(0, CoerceFiniteNumber(gain, this.gain));

        const mode = CoerceFiniteNumber(strictMode, this.strictMode);
        this.strictMode = mode === StrictMode.Enabled ? StrictMode.Enabled : StrictMode.Disabled;
    }

    public async initializeOnAttachment(context: AudioContext): Promise<void> {
        this.context = context;
        this.audioWorkletNode = CreateAudioWorkletNode<HardClipOptions>(context, AudioWorkletProcessorNames.HardClip, this.returnOptionsAsObject());
    }

    public returnOptionsAsObject(): HardClipOptions {
        return {
            drive: this.drive,
            gain: this.gain,
            strictMode: this.strictMode
        }
    }

     public setDrive(drive: number): boolean {
        drive = Math.max(0, CoerceFiniteNumber(drive, this.drive));
        this.drive = drive;
        return SendMessageToWorklet<HardClipMessageCommandId, number>(this.audioWorkletNode, HardClipMessageCommandId.SetDrive, drive);
    }

    public setGain(gain: number): boolean{
        gain = Math.max(0, CoerceFiniteNumber(gain, this.gain));
        this.gain = gain;
        return SendMessageToWorklet<HardClipMessageCommandId, number>(this.audioWorkletNode, HardClipMessageCommandId.SetGain, gain);
    }
}
