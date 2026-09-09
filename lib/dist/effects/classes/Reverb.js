import { Effector } from "../../core/exports";
import { AudioWorkletProcessorNames, StrictMode } from "../../typings";
import { coerceFiniteNumber, createAudioWorkletNode, sendMessageToWorklet } from "../../utilities/helpers";
export var ReverbMessageCommandId;
(function (ReverbMessageCommandId) {
    ReverbMessageCommandId[ReverbMessageCommandId["SetRoomSize"] = 0] = "SetRoomSize";
    ReverbMessageCommandId[ReverbMessageCommandId["SetDamping"] = 1] = "SetDamping";
    ReverbMessageCommandId[ReverbMessageCommandId["SetMix"] = 2] = "SetMix";
    ReverbMessageCommandId[ReverbMessageCommandId["SetStereoSpreadMs"] = 3] = "SetStereoSpreadMs";
})(ReverbMessageCommandId || (ReverbMessageCommandId = {}));
export class Reverb extends Effector {
    label = "Reverb";
    name = "Reverb";
    roomSize = 0.3;
    damping = 0.5;
    mix = 0.3;
    stereoSpreadMs = 0;
    strictMode = StrictMode.Disabled;
    constructor(options) {
        super();
        this.roomSize = Math.max(0, coerceFiniteNumber(options?.roomSize ?? this.roomSize, this.roomSize));
        this.damping = Math.max(0, coerceFiniteNumber(options?.damping ?? this.damping, this.damping));
        this.mix = Math.max(0, coerceFiniteNumber(options?.mix ?? this.mix, this.mix));
        this.stereoSpreadMs = Math.max(0, coerceFiniteNumber(options?.stereoSpreadMs ?? this.stereoSpreadMs, this.stereoSpreadMs));
        const mode = coerceFiniteNumber(options?.strictMode ?? this.strictMode, this.strictMode);
        this.strictMode = mode === StrictMode.Enabled ? StrictMode.Enabled : StrictMode.Disabled;
    }
    async initializeOnAttachment(context) {
        this.context = context;
        this.audioWorkletNode = createAudioWorkletNode(context, AudioWorkletProcessorNames.Reverb, this.returnOptionsAsObject());
    }
    returnOptionsAsObject() {
        return {
            roomSize: this.roomSize,
            damping: this.damping,
            mix: this.mix,
            stereoSpreadMs: this.stereoSpreadMs,
            strictMode: this.strictMode
        };
    }
    setRoomSize(roomSize) {
        roomSize = Math.max(0, coerceFiniteNumber(roomSize ?? this.roomSize, this.roomSize));
        this.roomSize = roomSize;
        return sendMessageToWorklet(this.audioWorkletNode, ReverbMessageCommandId.SetRoomSize, roomSize);
    }
    setDamping(damping) {
        damping = Math.max(0, coerceFiniteNumber(damping ?? this.damping, this.damping));
        this.damping = damping;
        return sendMessageToWorklet(this.audioWorkletNode, ReverbMessageCommandId.SetDamping, damping);
    }
    setMix(mix) {
        mix = Math.max(0, coerceFiniteNumber(mix ?? this.mix, this.mix));
        this.mix = mix;
        return sendMessageToWorklet(this.audioWorkletNode, ReverbMessageCommandId.SetMix, mix);
    }
    setStereoSpreadMs(stereoSpreadMs) {
        stereoSpreadMs = Math.max(0, coerceFiniteNumber(stereoSpreadMs ?? this.stereoSpreadMs, this.stereoSpreadMs));
        this.stereoSpreadMs = stereoSpreadMs;
        return sendMessageToWorklet(this.audioWorkletNode, ReverbMessageCommandId.SetStereoSpreadMs, stereoSpreadMs);
    }
}
