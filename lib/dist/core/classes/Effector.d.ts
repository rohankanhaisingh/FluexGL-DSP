export declare abstract class Effector {
    id: string;
    label: string | null;
    name: string;
    audioWorkletNode: AudioWorkletNode | null;
    parentialContext: AudioContext | null;
    abstract InitializeOnAttachment(parentialContext: AudioContext): Promise<void>;
}
//# sourceMappingURL=Effector.d.ts.map