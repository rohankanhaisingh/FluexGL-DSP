import { compiledWebAssemblyModule } from "../../utilities/web-assembly";
import { Effector } from "../../core/classes/Effector";
import { Debug } from "../../utilities/debugger";

export class SoftClip extends Effector {

    public label: string | null = "SoftClip";
    public name: string = "SoftClip";

    constructor(public drive: number = 1) {
        super();
    }

    public async InitializeOnAttachment(parentialContext: AudioContext): Promise<void> {

        if(!compiledWebAssemblyModule) return Debug.Error("Could not initialize effector because the nessecary WASM file has not been specified.", [
            `Effector type: SoftClip`
        ]);

        this.audioWorkletNode = new AudioWorkletNode(parentialContext, "SoftClipProcessor", {
            numberOfInputs: 1,
            numberOfOutputs: 1,
            outputChannelCount: [2],
            parameterData: {
                drive: this.drive
            },
            processorOptions: {
                module: compiledWebAssemblyModule
            }
        });

        this.parentialContext = parentialContext;
    }

    public SetDrive(drive: number): SoftClip {

        if(this.audioWorkletNode) this.audioWorkletNode.port.postMessage({
            type: "set-drive",
            value: drive
        });

        this.drive = drive;
        return this;
    }
}