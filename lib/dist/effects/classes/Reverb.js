import { Effector } from "../../core/exports";
import { AudioWorkletProcessorNames, StrictMode } from "../../typings";
import { coerceFiniteNumber, createAudioWorkletNode, sendMessageToWorklet } from "../../utilities/helpers";
/**
 * Must match ReverbMessageCommandId in the ReverbProcessor worklet.
 * The processor works with separate dry and wet levels; `mix` is translated into both.
 */
export var ReverbMessageCommandId;
(function (ReverbMessageCommandId) {
    ReverbMessageCommandId[ReverbMessageCommandId["SetRoomSize"] = 0] = "SetRoomSize";
    ReverbMessageCommandId[ReverbMessageCommandId["SetDamping"] = 1] = "SetDamping";
    ReverbMessageCommandId[ReverbMessageCommandId["SetDry"] = 2] = "SetDry";
    ReverbMessageCommandId[ReverbMessageCommandId["SetWet"] = 3] = "SetWet";
    ReverbMessageCommandId[ReverbMessageCommandId["SetPreDelayMs"] = 4] = "SetPreDelayMs";
    ReverbMessageCommandId[ReverbMessageCommandId["SetStereoSpreadMs"] = 5] = "SetStereoSpreadMs";
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
        this.mix = Math.min(1, Math.max(0, coerceFiniteNumber(options?.mix ?? this.mix, this.mix)));
        this.stereoSpreadMs = Math.max(0, coerceFiniteNumber(options?.stereoSpreadMs ?? this.stereoSpreadMs, this.stereoSpreadMs));
        const mode = coerceFiniteNumber(options?.strictMode ?? this.strictMode, this.strictMode);
        this.strictMode = mode === StrictMode.Enabled ? StrictMode.Enabled : StrictMode.Disabled;
    }
    async initializeOnAttachment(context) {
        if (this.context === context && this.audioWorkletNode)
            return;
        this.context = context;
        this.audioWorkletNode = createAudioWorkletNode(context, AudioWorkletProcessorNames.Reverb, {
            ...this.returnOptionsAsObject(),
            dry: 1 - this.mix,
            wet: this.mix
        });
        this.registerMessageEventListener(this.audioWorkletNode);
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
    /**
     * Sets the dry/wet balance, between 0 (dry only) and 1 (wet only).
     */
    setMix(mix) {
        mix = Math.min(1, Math.max(0, coerceFiniteNumber(mix ?? this.mix, this.mix)));
        this.mix = mix;
        return sendMessageToWorklet(this.audioWorkletNode, ReverbMessageCommandId.SetDry, 1 - mix)
            && sendMessageToWorklet(this.audioWorkletNode, ReverbMessageCommandId.SetWet, mix);
    }
    setStereoSpreadMs(stereoSpreadMs) {
        stereoSpreadMs = Math.max(0, coerceFiniteNumber(stereoSpreadMs ?? this.stereoSpreadMs, this.stereoSpreadMs));
        this.stereoSpreadMs = stereoSpreadMs;
        return sendMessageToWorklet(this.audioWorkletNode, ReverbMessageCommandId.SetStereoSpreadMs, stereoSpreadMs);
    }
}
