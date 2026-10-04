import { Effector } from "../../core/exports";
import { AudioWorkletProcessorNames, StrictMode } from "../../typings";
import { coerceFiniteNumber, createAudioWorkletNode, sendMessageToWorklet } from "../../utilities/helpers";

export interface ReverbOptions {
    roomSize: number;
    damping: number;
    mix: number;
    stereoSpreadMs: number;
    strictMode: StrictMode;
}

/**
 * Must match ReverbMessageCommandId in the ReverbProcessor worklet.
 * The processor works with separate dry and wet levels; `mix` is translated into both.
 */
export enum ReverbMessageCommandId {
    SetRoomSize,
    SetDamping,
    SetDry,
    SetWet,
    SetPreDelayMs,
    SetStereoSpreadMs
}

export class Reverb extends Effector {

    public label: string | null = "Reverb";
    public name: string = "Reverb";

    public roomSize: number = 0.3;
    public damping: number = 0.5;
    public mix: number = 0.3;
    public stereoSpreadMs: number = 0;
    public strictMode: StrictMode = StrictMode.Disabled;

    constructor(options?: Partial<ReverbOptions>) {
        super();

        this.roomSize = Math.max(0, coerceFiniteNumber(options?.roomSize ?? this.roomSize, this.roomSize));
        this.damping = Math.max(0, coerceFiniteNumber(options?.damping ?? this.damping, this.damping));
        this.mix = Math.min(1, Math.max(0, coerceFiniteNumber(options?.mix ?? this.mix, this.mix)));
        this.stereoSpreadMs = Math.max(0, coerceFiniteNumber(options?.stereoSpreadMs ?? this.stereoSpreadMs, this.stereoSpreadMs));

        const mode = coerceFiniteNumber(options?.strictMode ?? this.strictMode, this.strictMode);
        this.strictMode = mode === StrictMode.Enabled ? StrictMode.Enabled : StrictMode.Disabled;
    }

    public async initializeOnAttachment(context: AudioContext): Promise<void> {

        if (this.context === context && this.audioWorkletNode) return;

        this.context = context;
        this.audioWorkletNode = createAudioWorkletNode(context, AudioWorkletProcessorNames.Reverb, {
            ...this.returnOptionsAsObject(),
            dry: 1 - this.mix,
            wet: this.mix
        });

        this.registerMessageEventListener(this.audioWorkletNode);
    }

    public returnOptionsAsObject(): ReverbOptions {
        return {
            roomSize: this.roomSize,
            damping: this.damping,
            mix: this.mix,
            stereoSpreadMs: this.stereoSpreadMs,
            strictMode: this.strictMode
        }
    }

    public setRoomSize(roomSize: number): boolean {
        roomSize = Math.max(0, coerceFiniteNumber(roomSize ?? this.roomSize, this.roomSize));
        this.roomSize = roomSize;
        return sendMessageToWorklet<ReverbMessageCommandId, number>(this.audioWorkletNode, ReverbMessageCommandId.SetRoomSize, roomSize);
    }

    public setDamping(damping: number): boolean {
        damping = Math.max(0, coerceFiniteNumber(damping ?? this.damping, this.damping));
        this.damping = damping;
        return sendMessageToWorklet<ReverbMessageCommandId, number>(this.audioWorkletNode, ReverbMessageCommandId.SetDamping, damping);
    }

    /**
     * Sets the dry/wet balance, between 0 (dry only) and 1 (wet only).
     */
    public setMix(mix: number): boolean {
        mix = Math.min(1, Math.max(0, coerceFiniteNumber(mix ?? this.mix, this.mix)));
        this.mix = mix;
        return sendMessageToWorklet<ReverbMessageCommandId, number>(this.audioWorkletNode, ReverbMessageCommandId.SetDry, 1 - mix)
            && sendMessageToWorklet<ReverbMessageCommandId, number>(this.audioWorkletNode, ReverbMessageCommandId.SetWet, mix);
    }

    public setStereoSpreadMs(stereoSpreadMs: number) {
        stereoSpreadMs = Math.max(0, coerceFiniteNumber(stereoSpreadMs ?? this.stereoSpreadMs, this.stereoSpreadMs));
        this.stereoSpreadMs = stereoSpreadMs;
        return sendMessageToWorklet<ReverbMessageCommandId, number>(this.audioWorkletNode, ReverbMessageCommandId.SetStereoSpreadMs, stereoSpreadMs);
    }
}