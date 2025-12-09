import { compiledWebAssemblyModule } from "../../utilities/web-assembly";
import { Effector } from "../../core/classes/Effector";
import { Debug } from "../../utilities/debugger";
export class SoftClip extends Effector {
    drive;
    label = "SoftClip";
    name = "SoftClip";
    constructor(drive = 1) {
        super();
        this.drive = drive;
    }
    async InitializeOnAttachment(parentialContext) {
        if (!compiledWebAssemblyModule)
            return Debug.Error("Could not initialize effector because the nessecary WASM file has not been specified.", [
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
    SetDrive(drive) {
        if (this.audioWorkletNode)
            this.audioWorkletNode.port.postMessage({
                type: "set-drive",
                value: drive
            });
        this.drive = drive;
        return this;
    }
}
