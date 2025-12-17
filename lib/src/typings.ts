export type ChannelSpatialization = "mono" | "stereo" | "surround";
export type AudioClipAnalyserType = "pre" | "post";
export type AudioClipAnalyserProperty = "fftSize" | "minDecibels" | "maxDecibels" | "smoothingTimeConstant";
export type IncomingMessageType = "message" | "error" | "warning" | "wasm-instantiated";

export type AudioClipEvents = {
    [K in keyof AudioClipEventMap]: AudioClipEventMap[K][];
}

export type EffectorEvents = {
    [K in keyof EffectorEventMap]: EffectorEventMap[K][];
}

export enum LowPassFilterMessageCommandId {
    SetCutoff,
    SetMinFrequency,
    SetQ
}

export enum ChorusMessageCommandId {
    SetBaseDelayMs,
    SetDepthMs,
    SetRateHz,
    SetMix,
    SetFeedback
}

export enum SoftClipMessageCommandId {
    SetDrive,
    SetGain
}

export enum HardClipMessageCommandId {
    SetDrive,
    SetGain
}

export enum AudioWorkletProcessorNames {
    Compressor = "CompressorProcessor",
    MultibandCompressor = "MultibandCompressorProcessor",
    AdvancedDelay = "AdvancedDelayProcessor",
    MonoDelay = "MonoDelayProcessor",
    PingPongDelay = "PingPongDelayProcessor",
    StereoDelay = "StereoDelayProcessor",
    LowPassFilter = "LowPassFilterProcessor",
    HighPassFilter = "HighPassFilterProcessor",
    BandPassFilter = "BandPassFilterProcessor",
    NotchFilter = "NotchFilterProcessor",
    Chorus = "ChorusProcessor",
    Flanger = "FlangerProcessor",
    Phaser = "PhaserProcessor",
    Reverb = "ReverbProcessor",
    SoftClip = "SoftClipProcessor",
    HardClip = "HardClipProcessor"
}

export enum ProcessorIdentificationCodes {
    UnknownProcessorId = "UNKNOWN_PROCESSOR_ID",
    UnknownProcessorName = "UNKNOWN_PROCESSOR_NAME",
    UnknownProcessorCreationDate = "UNKNOWN_PROCESSOR_CREATION_DATE"
}

export enum StrictMode {
    Disabled = 0x00,
    Enabled = 0x01
}

export interface DspDebuggerOptions {
    breakOnError: boolean;
    showInfo: boolean;
    showErrors: boolean;
    showWarnings: boolean;
}

export interface DspOptions {
    maxMasterChannels: number;
    maxTotalChannels: number;
    sampleRate: number;
    spatialization: ChannelSpatialization;
    debugger: DspDebuggerOptions;
    overrideMaxAudioBufferNodes: boolean;
}

export interface LoadAudioSourceOptions {
    allowForeignFileTypes: boolean;
}

export interface AudioSourceData {
    arrayBuffer: ArrayBuffer;
    audioBuffer: AudioBuffer;
    id: string;
    timestamp: number;
}

export interface ChannelOptions {
    label: string | null;
    maxAudioNodes: number;
    maxEffects: number;
}

export interface AudioClipOnProgressEvent {
    startTime: number;
    offset: number;
    current: number;
    contextTimestamp: number;
    formatted: string;
}

export interface AudioClipEventMap {
    "progress": (event: AudioClipOnProgressEvent) => void;
}

export interface DspPipelineInitializationOptions {
    pathToWasm: string;
    pathToWorklet: string;
    options?: Partial<DspOptions>;
}

export interface DspPipelineInitializationState {
    success: boolean;
    workletBlobUrl: string;
}

export interface ChorusEffectOptions {
    baseDelayMs: number;
    depthMs: number;
    rateHz: number;
    mix: number;
    feedback: number;
    strictMode: StrictMode;
}

export interface LowPassFilterOptions {
    cutoff: number;
    minFrequency: number;
    q: number;
    strictMode: StrictMode;
}

export interface SoftClipOptions {
    drive: number;
    gain: number;
    strictMode: StrictMode;
}

export interface HardClipOptions {
    drive: number;
    gain: number;
    strictMode: StrictMode;
}

export interface EffectorEventMap {
    "incoming-processor-message": (message: IncomingProcessorMessage) => void;
    "incoming-processor-warning": (message: IncomingProcessorMessage) => void;
    "incoming-processor-error": (message: IncomingProcessorMessage) => void;
    "initialized-on-channel-attachment": (message: IncomingProcessorMessage) => void;
    "processor-wasm-instantiated": (message: IncomingProcessorMessage) => void;
}

export interface ProcessorData {
    id: string | ProcessorIdentificationCodes.UnknownProcessorId;
    name: string | ProcessorIdentificationCodes.UnknownProcessorName;
    createdAt: number | ProcessorIdentificationCodes.UnknownProcessorCreationDate;
}

export interface IncomingProcessorMessage {
    id: string;
    timestamp: number;
    message: string;
    type: IncomingMessageType;
    processor: ProcessorData;
    additionalData?: any;
}