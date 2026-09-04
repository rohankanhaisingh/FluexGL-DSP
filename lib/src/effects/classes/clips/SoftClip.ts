import { coerceFiniteNumber, createAudioWorkletNode, sendMessageToWorklet } from "../../../utilities/helpers";
import { Effector } from "../../../core/classes/Effector";
import { SoftClipOptions, AudioWorkletProcessorNames, SoftClipMessageCommandId, StrictMode } from "../../../typings";

export class SoftClip extends Effector {

    public label: string | null = "SoftClip";
    public name: string = "SoftClip";

    public drive: number = 1;
    public gain: number = 1;
    public strictMode: StrictMode = StrictMode.Disabled;

    constructor({ drive, gain, strictMode }: Partial<SoftClipOptions> = {}) {
        super();

        this.drive = Math.max(0, coerceFiniteNumber(drive, this.drive));
        this.gain = Math.max(0, coerceFiniteNumber(gain, this.gain));

        const mode = coerceFiniteNumber(strictMode, this.strictMode);
        this.strictMode = mode === StrictMode.Enabled ? StrictMode.Enabled : StrictMode.Disabled;
    }

    public async initializeOnAttachment(context: AudioContext): Promise<void> {
    
        if(this.context === null) 
            this.context = context;
        
        if(this.audioWorkletNode === null) 
            this.audioWorkletNode = createAudioWorkletNode<SoftClipOptions>(context, AudioWorkletProcessorNames.SoftClip, this.returnOptionsAsObject());
    }

    public returnOptionsAsObject(): SoftClipOptions {
        return {
            drive: this.drive,
            gain: this.gain,
            strictMode: this.strictMode
        }
    }

    public setDrive(drive: number): boolean {
        drive = Math.max(0, coerceFiniteNumber(drive, this.drive));
        this.drive = drive;
        return sendMessageToWorklet<SoftClipMessageCommandId, number>(this.audioWorkletNode, SoftClipMessageCommandId.SetDrive, drive);
    }

    public setGain(gain: number): boolean{
        gain = Math.max(0, coerceFiniteNumber(gain, this.gain));
        this.gain = gain;
        return sendMessageToWorklet<SoftClipMessageCommandId, number>(this.audioWorkletNode, SoftClipMessageCommandId.SetGain, gain);
    }
}
