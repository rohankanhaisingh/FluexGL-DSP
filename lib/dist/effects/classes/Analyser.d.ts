import { Effector } from "../../core/exports";
export declare class Analyser extends Effector {
    label: string | null;
    name: string;
    analyserNode: AnalyserNode | null;
    waveformFloat32ArrayBuffer: Float32Array;
    waveformUint8ArrayBuffer: Uint8Array;
    frequencyFloat32ArrayBuffer: Float32Array;
    frequencyUint8ArrayBuffer: Uint8Array;
    private options;
    constructor(options?: Partial<AnalyserOptions>);
    InitializeOnAttachment(context: AudioContext): Promise<void>;
    SetOptions(options: Partial<AnalyserOptions>): void;
    GetWaveformFloatData(): Float32Array | null;
    GetWaveformByteData(): Uint8Array | null;
    GetFrequencyFloatData(): Float32Array | null;
    GetFrequencyByteData(): Uint8Array | null;
    private allocateBuffers;
}
//# sourceMappingURL=Analyser.d.ts.map