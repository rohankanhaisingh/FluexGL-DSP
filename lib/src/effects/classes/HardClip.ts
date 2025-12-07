import { compiledWebAssemblyModule } from "../../utilities/web-assembly";
import { Effector } from "../../core/classes/Effector";
import { Debug } from "../../utilities/debugger";

export class HardClip extends Effector {

    public label: string | null = "HardClip";
    public name: string = "HardClip";

    constructor(public drive: number = 1, public gain: number = 1) {
        super();
    }

    public async InitializeOnAttachment(parentialContext: AudioContext): Promise<void> {

        if (!compiledWebAssemblyModule) return Debug.Error("Could not initialize effector because the nessecary WASM file has not been specified.", [
            `Effector type: HardClip`
        ]);

        this.audioWorkletNode = new AudioWorkletNode(parentialContext, "HardClipProcessor", {
            numberOfInputs: 1,
            numberOfOutputs: 1,
            outputChannelCount: [2],
            parameterData: {
                drive: this.drive,
                gain: this.gain
            },
            processorOptions: {
                module: compiledWebAssemblyModule
            }
        });

        this.parentialContext = parentialContext;
    }

    public SetDrive(drive: number): HardClip {

        if (this.audioWorkletNode) this.audioWorkletNode.port.postMessage({
            type: "set-drive",
            value: drive
        });

        this.drive = drive;
        return this;
    }

    public GetDrive(): number {
        return this.drive;
    }

    public SetGain(gain: number): HardClip {

        if (this.audioWorkletNode) this.audioWorkletNode.port.postMessage({
            type: "set-gain",
            value: gain
        })

        this.gain = gain;
        return this;
    }

    public GetGain(gain: number): number {
        return this.gain;
    }
}