import { Effector } from "../../core/exports";
import { StrictMode } from "../../typings";
export interface ReverbOptions {
    roomSize: number;
    damping: number;
    mix: number;
    stereoSpreadMs: number;
    strictMode: StrictMode;
}
export declare enum ReverbMessageCommandId {
    SetRoomSize = 0,
    SetDamping = 1,
    SetMix = 2,
    SetStereoSpreadMs = 3
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
    setMix(mix: number): boolean;
    setStereoSpreadMs(stereoSpreadMs: number): boolean;
}
//# sourceMappingURL=Reverb.d.ts.map