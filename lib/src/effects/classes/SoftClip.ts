import { compiledWebAssemblyModule } from "../../utilities/web-assembly";
import { Effector } from "../../core/classes/Effector";
import { Debug } from "../../utilities/debugger";

export class SoftClip extends Effector {

    constructor(public drive: number = 1) {
        super();
    }

    public async Initialize(): Promise<void> {

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


        this.gainNode = this.audioWorkletNode as unknown as GainNode;

        this.parentialContext = parentialContext;
    }

    public Process(buffer: Float32Array): void {

        // Simple soft clipping algorithm

    }

    public SetDrive(drive: number): void {
        this.drive = drive;
    }
}