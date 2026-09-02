import { CoerceFiniteNumber, SendMessageToWorklet, CreateAudioWorkletNode } from "../../utilities/helpers";
import { Effector } from "../../core/classes/Effector";
import { ChorusEffectOptions, ChorusMessageCommandId, AudioWorkletProcessorNames, StrictMode } from "../../typings";

export class Chorus extends Effector {

    public label: string | null = "Chorus";
    public name: string = "Chorus";

    public baseDelayMs: number = 15;
    public depthMs: number = 8;
    public rateHz: number = 1.5;
    public mix: number = 0.5;
    public feedback: number = 0.2;
    public strictMode: StrictMode = StrictMode.Disabled;

    constructor({ baseDelayMs, depthMs, rateHz, mix, feedback, strictMode }: Partial<ChorusEffectOptions>) {
        super();

        this.baseDelayMs = Math.max(0, CoerceFiniteNumber(baseDelayMs, this.baseDelayMs));
        this.depthMs = Math.max(0, CoerceFiniteNumber(depthMs, this.depthMs));
        this.rateHz = Math.max(0, CoerceFiniteNumber(rateHz, this.rateHz));
        this.mix = Math.max(0, Math.min(1, CoerceFiniteNumber(mix, this.mix)));
        this.feedback = Math.max(0, Math.min(1, CoerceFiniteNumber(feedback, this.feedback)));

        const mode = CoerceFiniteNumber(strictMode, this.strictMode);
        this.strictMode = mode === StrictMode.Enabled ? StrictMode.Enabled : StrictMode.Disabled;
    }

    public async initializeOnAttachment(context: AudioContext): Promise<void> {
        this.context = context;
        this.audioWorkletNode = CreateAudioWorkletNode<ChorusEffectOptions>(context, AudioWorkletProcessorNames.Chorus, this.returnOptionsAsObject());
    }

    public returnOptionsAsObject(): ChorusEffectOptions {
        return {
            baseDelayMs: this.baseDelayMs,
            depthMs: this.depthMs,
            rateHz: this.rateHz,
            mix: this.mix,
            feedback: this.feedback,
            strictMode: this.strictMode
        }
    }

    public setBaseDelayMs(value: number): boolean {
        value = Math.max(0, CoerceFiniteNumber(value, this.baseDelayMs));
        this.baseDelayMs = value;
        return SendMessageToWorklet<ChorusMessageCommandId, number>(this.audioWorkletNode, ChorusMessageCommandId.SetBaseDelayMs, value);
    }

    public setDepthMs(value: number) {
        value = Math.max(0, CoerceFiniteNumber(value, this.depthMs));
        this.depthMs = value;
        return SendMessageToWorklet<ChorusMessageCommandId, number>(this.audioWorkletNode, ChorusMessageCommandId.SetDepthMs, value);
    }

    public setRateHz(value: number) {
        value = Math.max(0, CoerceFiniteNumber(value, this.rateHz));
        this.rateHz = value;
        return SendMessageToWorklet<ChorusMessageCommandId, number>(this.audioWorkletNode, ChorusMessageCommandId.SetRateHz, value);
    }

    public setMix(value: number) {
        value = Math.max(0, Math.min(1, CoerceFiniteNumber(value, this.mix)));
        this.mix = value;
        return SendMessageToWorklet<ChorusMessageCommandId, number>(this.audioWorkletNode, ChorusMessageCommandId.SetMix, value);
    }

    public setFeedback(value: number) {
        value = Math.max(0, Math.min(1, CoerceFiniteNumber(value, this.feedback)));
        this.feedback = value;
        return SendMessageToWorklet<ChorusMessageCommandId, number>(this.audioWorkletNode, ChorusMessageCommandId.SetFeedback, value);
    }
}
