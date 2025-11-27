import { compiledWebAssemblyModule } from "../../utilities/web-assembly";
import { Effector } from "../../core/classes/Effector";
import { Debug } from "../../utilities/debugger";
import { ChorusEffectOptions } from "../../typings";

export class Chorus extends Effector {

    public label: string | null = "Chorus";
    public name: string = "Chorus";

    public baseDelayMs: number = 15;
    public depthMs: number = 8;
    public rateHz: number = 1.5;
    public mix: number = 0.5;
    public feedback: number = 0.2;

    public options: ChorusEffectOptions = {};

    private sampleRate: number = 0;

    constructor(options?: ChorusEffectOptions) {
        super();

        this.options = {
            baseDelayMs: this.baseDelayMs,
            depthMs: this.depthMs,
            rateHz: this.rateHz,
            mix: this.mix,
            feedback: this.mix,
            ...options
        }
    }

    public async InitializeOnAttachment(parentialContext: AudioContext): Promise<void> {

        if (!compiledWebAssemblyModule) return Debug.Error("Could not initialize effector because the nessecary WASM file has not been specified.", [
            `Effector type: Chorus`
        ]);

        this.sampleRate = parentialContext.sampleRate;

        this.audioWorkletNode = new AudioWorkletNode(parentialContext, "ChorusProcessor", {
            numberOfInputs: 1,
            numberOfOutputs: 1,
            outputChannelCount: [2],
            parameterData: {
                ...this.options,
                sampleRate: this.sampleRate
            },
            processorOptions: {
                module: compiledWebAssemblyModule
            }
        });

        this.parentialContext = parentialContext;
    }

    public SetBaseDelayMs(value: number) {

        this.baseDelayMs = value;
        this.options.baseDelayMs = value;

        this.audioWorkletNode?.port.postMessage({
            type: "set-base-delay-ms",
            value
        });
    }

    public SetDepthMs(value: number) {

        this.depthMs = value;
        this.options.depthMs = value;

        this.audioWorkletNode?.port.postMessage({
            type: "set-depth-ms",
            value
        });
    }

    public SetRateHz(value: number) {

        this.rateHz = value;
        this.options.rateHz = value;

        this.audioWorkletNode?.port.postMessage({
            type: "set-rate-hz",
            value
        });
    }

    public SetMix(value: number) {

        this.mix = value;
        this.options.mix = value;

        this.audioWorkletNode?.port.postMessage({
            type: "set-mix",
            value
        });
    }

    public SetFeedback(value: number) {

        this.feedback = value;
        this.options.feedback = value;

        this.audioWorkletNode?.port.postMessage({
            type: "set-mix",
            value
        });
    }
}