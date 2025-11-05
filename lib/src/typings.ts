export type ChannelSpatialization = "mono" | "stereo" | "surround";

export type AudioClipAnalyserType = "pre" | "post";
export type AudioClipAnalyserProperty = "fftSize" | "minDecibels" | "maxDecibels" | "smoothingTimeConstant";

export type AudioClipEvents  = {
    [K in keyof AudioClipEventMap]: AudioClipEventMap[K][];
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