import { Effector } from "../../core/exports";
export declare class Analyser extends Effector {
    label: string | null;
    name: string;
    analyserNode: AnalyserNode | null;
    waveformFloat32ArrayBuffer: Float32Array<ArrayBuffer>;
    waveformUint8ArrayBuffer: Uint8Array<ArrayBuffer>;
    frequencyFloat32ArrayBuffer: Float32Array<ArrayBuffer>;
    frequencyUint8ArrayBuffer: Uint8Array<ArrayBuffer>;
    private options;
    constructor(options?: Partial<AnalyserOptions>);
    initializeOnAttachment(context: AudioContext): Promise<void>;
    setOptions(options: Partial<AnalyserOptions>): void;
    getWaveformFloatData(): Float32Array | null;
    getWaveformByteData(): Uint8Array | null;
    getFrequencyFloatData(): Float32Array | null;
    getFrequencyByteData(): Uint8Array | null;
    private allocateBuffers;
}
//# sourceMappingURL=Analyser.d.ts.map