export declare type ChannelSpatialization = "mono" | "stereo" | "surround";
export declare type AudioClipAnalyserType = "pre" | "post";
export declare type AudioClipAnalyserProperty = "fftSize" | "minDecibels" | "maxDecibels" | "smoothingTimeConstant";
export declare type AudioClipEvents = {
    [K in keyof AudioClipEventMap]: AudioClipEventMap[K][];
};
export declare enum LowPassFilterMessageCommandId {
    SetCutoff = 0,
    SetMinFrequency = 1
}
export declare enum ChorusMessageCommandId {
    SetBaseDelayMs = 0,
    SetDepthMs = 1,
    SetRateHz = 2,
    SetMix = 3,
    SetFeedback = 4
}
export declare enum SoftClipMessageCommandId {
    SetDrive = 0,
    SetGain = 1
}
export declare enum HardClipMessageCommandId {
    SetDrive = 0,
    SetGain = 1
}
export declare enum AudioWorkletProcessorNames {
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
export interface FluexGLAudioDebuggerOptions {
    breakOnError: boolean;
    showInfo: boolean;
    showErrors: boolean;
    showWarnings: boolean;
}
export interface FluexGLAudioOptions {
    maxMasterChannels: number;
    maxTotalChannels: number;
    sampleRate: number;
    spatialization: ChannelSpatialization;
    debugger: FluexGLAudioDebuggerOptions;
}
export interface FluexGLAudioDescriptor {
    name: string;
    author: string;
    version: string;
    license: string;
    repository: string;
    options: FluexGLAudioOptions;
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
}
export interface LowPassFilterOptions {
    cutoff: number;
    minFrequency: number;
}
export interface SoftClipOptions {
    drive: number;
    gain: number;
}
export interface HardClipOptions {
    drive: number;
    gain: number;
}
//# sourceMappingURL=typings.d.ts.map