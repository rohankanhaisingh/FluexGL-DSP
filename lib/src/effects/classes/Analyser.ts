import { Effector } from "../../core/exports";

type AnalyserOptionKeys = keyof Omit<AnalyserOptions, "channelCount" | "channelCountMode" | "channelInterpretation">;

export class Analyser extends Effector {

    public label: string | null = "Analyser";
    public name: string = "Analyser";

    public analyserNode: AnalyserNode | null = null;

    public float32ArrayBuffer = new Float32Array();
    public uint8ArrayBuffer = new Uint8Array();

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

        this.analyserNode.getFloatTimeDomainData(this.float32ArrayBuffer);
        return this.float32ArrayBuffer;
    }

    public GetWaveformByteData(): Uint8Array | null {

        if (!this.analyserNode) return null;

        this.analyserNode.getByteTimeDomainData(this.uint8ArrayBuffer);
        return this.uint8ArrayBuffer;
    }

    private allocateBuffers(): void {

        if (!this.analyserNode) return;

        this.float32ArrayBuffer = new Float32Array(this.analyserNode.fftSize);
        this.uint8ArrayBuffer = new Uint8Array(this.analyserNode.fftSize);
    }
}
