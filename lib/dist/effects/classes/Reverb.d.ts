import { Effector } from "../../core/exports";
import { StrictMode } from "../../typings";
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
export declare enum ReverbMessageCommandId {
    SetRoomSize = 0,
    SetDamping = 1,
    SetDry = 2,
    SetWet = 3,
    SetPreDelayMs = 4,
    SetStereoSpreadMs = 5
}
export declare class Reverb extends Effector {
    label: string | null;
    name: string;
    roomSize: number;
    damping: number;
    mix: number;
    stereoSpreadMs: number;
    strictMode: StrictMode;
    constructor(options?: Partial<ReverbOptions>);
    initializeOnAttachment(context: AudioContext): Promise<void>;
    returnOptionsAsObject(): ReverbOptions;
    setRoomSize(roomSize: number): boolean;
    setDamping(damping: number): boolean;
    /**
     * Sets the dry/wet balance, between 0 (dry only) and 1 (wet only).
     */
    setMix(mix: number): boolean;
    setStereoSpreadMs(stereoSpreadMs: number): boolean;
}
//# sourceMappingURL=Reverb.d.ts.map