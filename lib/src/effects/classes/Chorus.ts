import { SendMessageToWorklet, CreateAudioWorkletNode } from "../../utilities/helpers";
import { Effector } from "../../core/classes/Effector";
import { ChorusEffectOptions, ChorusMessageCommandId, AudioWorkletProcessorNames } from "../../typings";

export class Chorus extends Effector {

    public label: string | null = "Chorus";
    public name: string = "Chorus";

    public baseDelayMs: number = 15;
    public depthMs: number = 8;
    public rateHz: number = 1.5;
    public mix: number = 0.5;
    public feedback: number = 0.2;

    constructor({ baseDelayMs, depthMs, rateHz, mix, feedback }: Partial<ChorusEffectOptions>) {
        super();

        this.baseDelayMs = baseDelayMs ?? this.baseDelayMs;
        this.depthMs = depthMs ?? this.depthMs;
        this.rateHz = rateHz ?? this.rateHz;
        this.mix = mix ?? this.mix;
        this.feedback = feedback ?? this.feedback;
    }

    public async InitializeOnAttachment(context: AudioContext): Promise<void> {
        this.context = context;
        this.audioWorkletNode = CreateAudioWorkletNode<ChorusEffectOptions>(context, AudioWorkletProcessorNames.Chorus, this.ReturnOptionsAsObject());
    }

    public ReturnOptionsAsObject(): ChorusEffectOptions {
        return {
            baseDelayMs: this.baseDelayMs,
            depthMs: this.depthMs,
            rateHz: this.rateHz,
            mix: this.mix,
            feedback: this.feedback,
        }
    }

    public SetBaseDelayMs(value: number): boolean {
        this.baseDelayMs = value;
        return SendMessageToWorklet<ChorusMessageCommandId, number>(this.audioWorkletNode, ChorusMessageCommandId.SetBaseDelayMs, value);
    }

    public SetDepthMs(value: number) {
        this.depthMs = value;
        return SendMessageToWorklet<ChorusMessageCommandId, number>(this.audioWorkletNode, ChorusMessageCommandId.SetDepthMs, value);
    }

    public SetRateHz(value: number) {
        this.rateHz = value;
        return SendMessageToWorklet<ChorusMessageCommandId, number>(this.audioWorkletNode, ChorusMessageCommandId.SetRateHz, value);
    }

    public SetMix(value: number) {
        this.mix = value;
        return SendMessageToWorklet<ChorusMessageCommandId, number>(this.audioWorkletNode, ChorusMessageCommandId.SetMix, value);
    }

    public SetFeedback(value: number) {
        this.feedback = value;
        return SendMessageToWorklet<ChorusMessageCommandId, number>(this.audioWorkletNode, ChorusMessageCommandId.SetFeedback, value);
    }
}