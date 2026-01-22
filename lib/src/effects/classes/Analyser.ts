import { Effector } from "../../core/exports";

type AnalyserOptionKeys = keyof Omit<AnalyserOptions, "channelCount" | "channelCountMode" | "channelInterpretation">;

export class Analyser extends Effector {

    public label: string | null = "Analyser";
    public name: string = "Analyser";

    public analyserNode: AnalyserNode | null = null;

    public waveformFloat32ArrayBuffer = new Float32Array();
    public waveformUint8ArrayBuffer = new Uint8Array();
    public frequencyFloat32ArrayBuffer = new Float32Array();
    public frequencyUint8ArrayBuffer = new Uint8Array();

    private options: AnalyserOptions = {
        fftSize: 32,
        smoothingTimeConstant: 0.8,
        minDecibels: -90,
        maxDecibels: -10,
    };

    constructor(options?: Partial<AnalyserOptions>) {
        super();

        if (options) this.SetOptions(options);
    }

    public async InitializeOnAttachment(context: AudioContext): Promise<void> {

        this.context = context;
        this.analyserNode = new AnalyserNode(context, this.options);

        this.audioWorkletNode = this.analyserNode as unknown as AudioWorkletNode;
        this.allocateBuffers();
    }

    public SetOptions(options: Partial<AnalyserOptions>): void {

        (Object.keys(options) as AnalyserOptionKeys[]).forEach((key) => {
            const value = options[key];

            if (typeof value === "undefined") return;

            if (key === "fftSize" && value) {
                const allowed = [32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768];
                if (!allowed.includes(value)) return;
            }

            (this.options as any)[key] = value;

            if (this.analyserNode) {
                (this.analyserNode as any)[key] = value;
            }
        });

        if (options.fftSize && this.analyserNode) {
            this.allocateBuffers();
        }
    }

    public GetWaveformFloatData(): Float32Array | null {

        if (!this.analyserNode) return null;

        this.analyserNode.getFloatTimeDomainData(this.waveformFloat32ArrayBuffer);
        return this.waveformFloat32ArrayBuffer;
    }

    public GetWaveformByteData(): Uint8Array | null {

        if (!this.analyserNode) return null;

        this.analyserNode.getByteTimeDomainData(this.waveformUint8ArrayBuffer);
        return this.waveformUint8ArrayBuffer;
    }

    public GetFrequencyFloatData(): Float32Array | null {

        if(!this.analyserNode) return null;

        this.analyserNode.getFloatFrequencyData(this.frequencyFloat32ArrayBuffer);
        return this.frequencyFloat32ArrayBuffer;
    }

    public GetFrequencyByteData(): Uint8Array | null {

        if(!this.analyserNode) return null;

        this.analyserNode.getByteFrequencyData(this.frequencyUint8ArrayBuffer);
        return this.frequencyUint8ArrayBuffer;
    }

    private allocateBuffers(): void {

        if (!this.analyserNode) return;

        this.waveformFloat32ArrayBuffer = new Float32Array(this.analyserNode.fftSize);
        this.waveformUint8ArrayBuffer = new Uint8Array(this.analyserNode.fftSize);
        this.frequencyFloat32ArrayBuffer = new Float32Array(this.analyserNode.fftSize);
        this.frequencyUint8ArrayBuffer = new Uint8Array(this.analyserNode.fftSize);
    }
}
