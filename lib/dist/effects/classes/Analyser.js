import { Effector } from "../../core/exports";
export class Analyser extends Effector {
    label = "Analyser";
    name = "Analyser";
    analyserNode = null;
    float32ArrayBuffer = new Float32Array();
    uint8ArrayBuffer = new Uint8Array();
    options = {
        fftSize: 32,
        smoothingTimeConstant: 0.8,
        minDecibels: -90,
        maxDecibels: -10,
    };
    constructor(options) {
        super();
        if (options)
            this.SetOptions(options);
    }
    async InitializeOnAttachment(context) {
        this.context = context;
        this.analyserNode = new AnalyserNode(context, this.options);
        this.audioWorkletNode = this.analyserNode;
        this.allocateBuffers();
    }
    SetOptions(options) {
        Object.keys(options).forEach((key) => {
            const value = options[key];
            if (typeof value === "undefined")
                return;
            if (key === "fftSize" && value) {
                const allowed = [32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768];
                if (!allowed.includes(value))
                    return;
            }
            this.options[key] = value;
            if (this.analyserNode) {
                this.analyserNode[key] = value;
            }
        });
        if (options.fftSize && this.analyserNode) {
            this.allocateBuffers();
        }
    }
    GetWaveformFloatData() {
        if (!this.analyserNode)
            return null;
        this.analyserNode.getFloatTimeDomainData(this.float32ArrayBuffer);
        return this.float32ArrayBuffer;
    }
    GetWaveformByteData() {
        if (!this.analyserNode)
            return null;
        this.analyserNode.getByteTimeDomainData(this.uint8ArrayBuffer);
        return this.uint8ArrayBuffer;
    }
    allocateBuffers() {
        if (!this.analyserNode)
            return;
        this.float32ArrayBuffer = new Float32Array(this.analyserNode.fftSize);
        this.uint8ArrayBuffer = new Uint8Array(this.analyserNode.fftSize);
    }
}
