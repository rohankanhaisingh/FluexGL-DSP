export type ChannelSpatialization = "mono" | "stereo" | "surround";
export type AudioClipAnalyserType = "pre" | "post";
export type AudioClipAnalyserProperty = "fftSize" | "minDecibels" | "maxDecibels" | "smoothingTimeConstant";
export type IncomingMessageType = "message" | "error" | "warning" | "wasm-instantiated";
export type ArrayPosition = "start" | "middle" | "end" | "one-after-start" | "one-before-end";
export type AudioClipEvents = {
    [K in keyof AudioClipEventMap]: AudioClipEventMap[K][];
};
export type EffectorEvents = {
    [K in keyof EffectorEventMap]: EffectorEventMap[K][];
};
export declare enum LowPassFilterMessageCommandId {
    SetCutoff = 0,
    SetMinFrequency = 1,
    SetQ = 2
}
export declare enum HighPassFilterMessageCommandId {
    SetCutoff = 0,
    SetMaxFrequency = 1,
    SetQ = 2
}
export declare enum NotchFilterMessageCommandId {
    SetCutoff = 0,
    SetMinFrequency = 1,
    SetQ = 2
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
    HardClip = "HardClipProcessor",
    Equalizer = "EqualizerProcessor",
    Saturation = "SaturationProcessor"
}
/**
 * Commands understood by the shared delay processor (MonoDelay, StereoDelay, PingPongDelay, AdvancedDelay).
 * Must match DelayEngineMessageCommandId in the worklet.
 */
export declare enum AdvancedDelayMessageCommandId {
    SetDelayLeftMs = 0,
    SetDelayRightMs = 1,
    SetFeedback = 2,
    SetCrossFeedback = 3,
    SetMix = 4,
    SetLowCut = 5,
    SetHighCut = 6,
    SetModulationRate = 7,
    SetModulationDepth = 8,
    SetDrive = 9
}
export declare enum EqualizerMessageCommandId {
    SetBand = 0,
    SetOutputGain = 1
}
export declare enum SaturationMessageCommandId {
    SetDrive = 0,
    SetMode = 1,
    SetTone = 2,
    SetMix = 3,
    SetOutputGain = 4
}
export declare enum ProcessorIdentificationCodes {
    UnknownProcessorId = "UNKNOWN_PROCESSOR_ID",
    UnknownProcessorName = "UNKNOWN_PROCESSOR_NAME",
    UnknownProcessorCreationDate = "UNKNOWN_PROCESSOR_CREATION_DATE"
}
export declare enum StrictMode {
    Disabled = 0,
    Enabled = 1
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
export interface AudioClipOnInitializeEvent {
    durationOfInitialization: number;
    context: AudioContext | null;
}
export interface AudioClipOnPlayEvent {
    timestamp: number;
    audioBufferSourceNodes: AudioBufferSourceNode[];
    context: AudioContext;
}
export interface AudioClipEventMap {
    "progress": (event: AudioClipOnProgressEvent) => void;
    "initialize": (event: AudioClipOnInitializeEvent) => void;
    "play": (event: AudioClipOnPlayEvent) => void;
}
export interface DspPipelineInitializationOptions {
    pathToWasm: string;
    pathToWorklet: string;
    /** Partial options. Nested objects such as `debugger` are merged with the defaults. */
    options?: Partial<Omit<DspOptions, "debugger">> & {
        debugger?: Partial<DspDebuggerOptions>;
    };
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
export interface CompressorOptions {
    /** Level (dB) above which compression starts. Between -100 and 0. */
    threshold: number;
    /** Range (dB) above the threshold over which the curve smoothly transitions. Between 0 and 40. */
    knee: number;
    /** Amount of dB input change for 1 dB of output change. Between 1 and 20. */
    ratio: number;
    /** Time (seconds) to reduce the gain by 10 dB. Between 0 and 1. */
    attack: number;
    /** Time (seconds) to increase the gain by 10 dB. Between 0 and 1. */
    release: number;
    /** Gain (dB) applied after compression. Between -24 and 24. */
    makeupGain: number;
}
export interface LimiterOptions {
    /** Maximum output level (dB). Between -24 and 0. */
    ceiling: number;
    /** Time (seconds) for the limiter to recover. Between 0.01 and 1. */
    release: number;
    /** Gain (dB) applied before limiting. Use this to drive the signal into the limiter. Between -24 and 24. */
    inputGain: number;
}
export interface HighPassFilterOptions {
    cutoff: number;
    q: number;
    maxFrequency: number;
    strictMode: StrictMode;
}
export interface NotchFilterOptions {
    cutoff: number;
    q: number;
    minFrequency: number;
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
export interface Vector2 {
    x: number;
    y: number;
}
export interface Vector3 {
    x: number;
    y: number;
    z: number;
}
export type SpatialDistanceModel = "linear" | "inverse" | "exponential";
export type SpatialYAxisDirection = "down" | "up";
export type SpatialPanningModel = "stereo" | "equalpower" | "HRTF";
export interface SpatialAttenuationOptions {
    /** Distance model used to calculate the volume of a source. Mirrors the models of the Web Audio PannerNode. */
    distanceModel: SpatialDistanceModel;
    /** Distance at which the volume starts to drop. Within this distance the source plays at full volume. */
    refDistance: number;
    /** Distance at which the source is considered inaudible. */
    maxDistance: number;
    /** How fast the volume drops over distance. */
    rolloffFactor: number;
}
export interface SpatialAudioSourceOptions extends SpatialAttenuationOptions {
    label: string | null;
    /** Position of the source. z is ignored by the 2D renderer. */
    position: Vector2 | Vector3;
    volume: number;
    /** Whether this source may share a voice (channel) with other sources when it is far away. */
    clusterable: boolean;
    /** Multiplier for the reverb send of this source. 0 disables reverb for this source. */
    reverbSendFactor: number;
    /** Whether the distance based lowpass filter is applied to this source. */
    airAbsorption: boolean;
}
export interface SpatialAudioListenerOptions {
    position: Vector2;
    /**
     * Optional facing direction in radians, clockwise. 0 means facing up on the screen,
     * so left and right map to the x-axis. Games without a rotating listener can ignore this.
     */
    rotation: number;
    /** Direction of the y-axis on screen. Set by the renderer. */
    yAxis: SpatialYAxisDirection;
}
export interface SpatialAudioListener3DOptions {
    position: Vector3;
    /** Direction the listener is facing. Defaults to (0, 0, -1), like Web Audio and three.js. */
    forward: Vector3;
    /** Up direction of the listener. Defaults to (0, 1, 0). */
    up: Vector3;
}
export interface SpatialClusteringOptions {
    enabled: boolean;
    /** Sources closer than this distance to the listener always get their own voice. */
    splitDistance: number;
    /** Sources further than this distance may be merged into a cluster. Must be larger than splitDistance (hysteresis). */
    mergeDistance: number;
    /** Maximum angle (radians) between a source and the cluster centre, as seen from the listener. */
    maxAngle: number;
    /** Maximum relative distance difference between a source and the cluster centre (0.5 = 50%). */
    maxDistanceRatio: number;
    /** Maximum amount of sources per cluster. */
    maxMembers: number;
}
export interface SpatialAudioRendererOptions extends SpatialAttenuationOptions {
    label: string | null;
    /** Time constant (seconds) used to smooth parameter changes. */
    smoothing: number;
    /** Crossfade time (seconds) when a source moves between voices. */
    crossfadeTime: number;
    /** Cutoff frequency of the lowpass filter when the source is at refDistance. */
    lowpassMaxFrequency: number;
    /** Cutoff frequency of the lowpass filter when the source is at maxDistance. */
    lowpassMinFrequency: number;
    /** Additional cutoff multiplier for sources directly behind the listener (1 = no effect). */
    rearLowpassFactor: number;
    /** Reverb send level when the source is at refDistance. */
    reverbMinSend: number;
    /** Reverb send level when the source is at maxDistance. */
    reverbMaxSend: number;
    /** Gain below which a voice is considered inaudible and gets muted entirely. */
    silenceThreshold: number;
    /**
     * Maximum number of voices (a cluster counts as one). When more sources are audible, the quietest
     * ones become virtual: they keep being tracked, but are not rendered until they are loud enough
     * to take over the voice of a quieter source.
     */
    maxVoices: number;
    clustering: Partial<SpatialClusteringOptions>;
    /**
     * Safety limiter on the renderer's master channel, so many sources at once do not clip.
     * Pass false to disable it, or options to configure it. Enabled by default.
     */
    limiter: boolean | Partial<LimiterOptions>;
}
export interface SpatialAudioRenderer2DOptions extends SpatialAudioRendererOptions {
    /** Direction of the y-axis on screen. "down" for canvas-like coordinates, "up" for math-like coordinates. */
    yAxis: SpatialYAxisDirection;
}
export interface SpatialAudioRenderer3DOptions extends SpatialAudioRendererOptions {
    /**
     * How voices are panned. "HRTF" gives front/back and elevation cues (best with headphones),
     * "equalpower" is cheaper, "stereo" only pans left/right.
     */
    panningModel: SpatialPanningModel;
}
export interface SpatialSourceState {
    /** Position of the source relative to the listener, in listener space. x = right, y = up, z = forward. */
    local: Vector3;
    /** Unit vector from the listener towards the source, in listener space. (0, 0, 1) when the source is on the listener. */
    direction: Vector3;
    distance: number;
    /** Horizontal angle relative to the facing direction of the listener, in radians. Positive is to the right. */
    azimuth: number;
    /** Vertical angle relative to the listener, in radians. Positive is up. Always 0 in 2D. */
    elevation: number;
    /** Distance based attenuation, between 0 and 1. */
    attenuation: number;
    /** Normalized distance between refDistance (0) and maxDistance (1). */
    normalizedDistance: number;
}
export type EqualizerBandType = "peaking" | "lowshelf" | "highshelf" | "lowpass" | "highpass" | "notch" | "bandpass";
export interface EqualizerBand {
    type: EqualizerBandType;
    /** Center or corner frequency (Hz). */
    frequency: number;
    /** Boost or cut (dB), between -24 and 24. Only used by "peaking", "lowshelf" and "highshelf". */
    gain: number;
    /** Bandwidth (peaking, notch, bandpass), resonance (lowpass, highpass) or slope (shelves). Between 0.1 and 24. */
    q: number;
    enabled: boolean;
}
export interface EqualizerOptions {
    /** Up to 8 bands, processed in series. Defaults to a flat 5-band layout. */
    bands: Partial<EqualizerBand>[];
    /** Gain (dB) after the bands, between -24 and 24. */
    outputGain: number;
    strictMode: StrictMode;
}
export interface MonoDelayOptions {
    /** Delay time (ms), between 1 and 4000. */
    delayMs: number;
    /** Amount of each echo fed back into the delay, between 0 and 0.98. */
    feedback: number;
    /** Dry/wet mix, between 0 and 1. */
    mix: number;
    strictMode: StrictMode;
}
export interface PingPongDelayOptions extends MonoDelayOptions {
}
export interface StereoDelayOptions {
    /** Delay time of the left channel (ms), between 1 and 4000. */
    delayLeftMs: number;
    /** Delay time of the right channel (ms), between 1 and 4000. */
    delayRightMs: number;
    feedback: number;
    mix: number;
    strictMode: StrictMode;
}
export interface AdvancedDelayOptions extends StereoDelayOptions {
    /** How much of each side's feedback crosses over to the other side, between 0 (stereo) and 1 (ping-pong). */
    crossFeedback: number;
    /** Highpass in the feedback path (Hz), between 0 (off) and 2000. Thins out the repeats. */
    lowCut: number;
    /** Lowpass in the feedback path (Hz), 0 = off. Every repeat gets darker. */
    highCut: number;
    /** Delay time modulation speed (Hz), between 0 and 10. */
    modulationRate: number;
    /** Delay time modulation depth (ms), between 0 and 20. 0 disables modulation. */
    modulationDepth: number;
    /** Saturation in the feedback path, between 0 and 1. Warms up and softly limits the repeats. */
    drive: number;
}
export type SaturationMode = "soft" | "tube" | "tape";
export interface SaturationOptions {
    /** How hard the signal is pushed into the curve (dB), between 0 and 48. */
    drive: number;
    /** Curve: "soft" (tanh), "tube" (asymmetric, even harmonics) or "tape" (gentle knee). */
    mode: SaturationMode;
    /** Lowpass after the curve (Hz), 0 = off. Tames harsh harmonics. */
    tone: number;
    /** Dry/wet mix, between 0 and 1. */
    mix: number;
    /** Gain (dB) of the saturated signal, between -24 and 24. */
    outputGain: number;
    strictMode: StrictMode;
}
export interface StereoPannerOptions {
    /** Position in the stereo field, between -1 (left) and 1 (right). */
    pan: number;
    /** Stereo width, between 0 (mono) and 2 (extra wide). 1 leaves the image unchanged. */
    width: number;
}
export type MultibandCompressorBandName = "low" | "mid" | "high";
export interface MultibandCompressorBandOptions {
    /** Level (dB) above which compression starts. Between -100 and 0. */
    threshold: number;
    /** Range (dB) over which the curve transitions. Between 0 and 40. */
    knee: number;
    /** Between 1 and 20. */
    ratio: number;
    /** Seconds, between 0 and 1. */
    attack: number;
    /** Seconds, between 0 and 1. */
    release: number;
    /** Gain (dB) after compression, between -24 and 24. */
    makeupGain: number;
}
export interface MultibandCompressorOptions {
    /** Crossover between the low and mid band (Hz). */
    lowCrossover: number;
    /** Crossover between the mid and high band (Hz). */
    highCrossover: number;
    low: Partial<MultibandCompressorBandOptions>;
    mid: Partial<MultibandCompressorBandOptions>;
    high: Partial<MultibandCompressorBandOptions>;
    /** Gain (dB) after the bands are summed, between -24 and 24. */
    outputGain: number;
}
//# sourceMappingURL=typings.d.ts.map