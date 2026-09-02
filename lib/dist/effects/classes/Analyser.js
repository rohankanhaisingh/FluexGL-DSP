import { Effector } from "../../core/exports";
export class Analyser extends Effector {
    label = "Analyser";
    name = "Analyser";
    analyserNode = null;
    waveformFloat32ArrayBuffer = new Float32Array();
    waveformUint8ArrayBuffer = new Uint8Array();
    frequencyFloat32ArrayBuffer = new Float32Array();
    frequencyUint8ArrayBuffer = new Uint8Array();
    options = {
        fftSize: 32,
        smoothingTimeConstant: 0.8,
        minDecibels: -90,
        maxDecibels: -10,
    };
    constructor(options) {
        super();
        if (options)
            this.setOptions(options);
    }
    async initializeOnAttachment(context) {
        this.context = context;
        this.analyserNode = new AnalyserNode(context, this.options);
        this.audioWorkletNode = this.analyserNode;
        this.allocateBuffers();
    }
    setOptions(options) {
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
    getWaveformFloatData() {
        if (!this.analyserNode)
            return null;
        this.analyserNode.getFloatTimeDomainData(this.waveformFloat32ArrayBuffer);
        return this.waveformFloat32ArrayBuffer;
    }
    getWaveformByteData() {
        if (!this.analyserNode)
            return null;
        this.analyserNode.getByteTimeDomainData(this.waveformUint8ArrayBuffer);
        return this.waveformUint8ArrayBuffer;
    }
    getFrequencyFloatData() {
        if (!this.analyserNode)
            return null;
        this.analyserNode.getFloatFrequencyData(this.frequencyFloat32ArrayBuffer);
        return this.frequencyFloat32ArrayBuffer;
    }
    getFrequencyByteData() {
        if (!this.analyserNode)
            return null;
        this.analyserNode.getByteFrequencyData(this.frequencyUint8ArrayBuffer);
        return this.frequencyUint8ArrayBuffer;
    }
    allocateBuffers() {
        if (!this.analyserNode)
            return;
        this.waveformFloat32ArrayBuffer = new Float32Array(this.analyserNode.fftSize);
        this.waveformUint8ArrayBuffer = new Uint8Array(this.analyserNode.fftSize);
        this.frequencyFloat32ArrayBuffer = new Float32Array(this.analyserNode.fftSize);
        this.frequencyUint8ArrayBuffer = new Uint8Array(this.analyserNode.fftSize);
    }
}
