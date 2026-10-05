/**
 * FluexGL Audio
 * A javascript digital audio processor library.
 */

import { DspOptions } from "./typings";

export const DSP: DspOptions = {
    maxMasterChannels: 8,
    maxTotalChannels: 128,
    sampleRate: 41000,
    spatialization: "stereo",
    overrideMaxAudioBufferNodes: false,
    debugger: {
        showErrors: true,
        showInfo: true,
        showWarnings: true,
        breakOnError: true
    }
}

export {
    Chorus,
    Analyser,
    Distortion,
    Equalizer,
    Limiter,
    Saturation,
    StereoPanner,
    StereoMono,
    Compressor,
    MultibandCompressor,
    AdvancedDelay,
    MonoDelay,
    PingPongDelay,
    StereoDelay,
    SoftClip,
    LowPassFilter,
    HardClip,
    HighPassFilter,
    NotchFilter,
    Reverb, type ReverbOptions
} from "./effects/exports";

export {
    AudioDevice,
    Channel,
    InputChannel,
    Effector,
    Master,
    AudioClip,
    DspPipeline,
    AudioClipPlayer,
    SpatialAudioListener,
    SpatialAudioListener3D,
    SpatialAudioSource,
    SpatialAudioRenderer,
    SpatialAudioRenderer2D,
    SpatialAudioRenderer3D,
    type SpatialClusterInfo,
    type SpatialRendererStats
} from "./core/exports";

export {
    initializeDspPipeline,
    listAudioOutputDevices,
    listAudioInputDevices,
    findDefaultAudioDevice,
    watchAudioDevices,
    resolveAudioOutputDevices,
    resolveAudioInputDevices,
    resolveDefaultAudioInputDevice,
    resolveDefaultAudioOutputDevice,
    loadAudioSource,
    loadAudioSourceFromBlob,
    loadWorkletOnAudioDevice,
    sendMessageToWorklet
} from "./utilities/helpers";

export {
    SUPPORTED_FILE_TYPES,
    DEFAULT_SAMPLE_RATE
} from "./utilities/constants";

export {
    hasInitializedWasm,
} from "./utilities/web-assembly";

export {
    StrictMode,
    ProcessorIdentificationCodes,
    HardClipMessageCommandId,
    SoftClipMessageCommandId,
    AudioWorkletProcessorNames,
    ChorusMessageCommandId,
    LowPassFilterMessageCommandId,
    HighPassFilterMessageCommandId,
    NotchFilterMessageCommandId,
    AdvancedDelayMessageCommandId,
    EqualizerMessageCommandId,
    SaturationMessageCommandId,
} from "./typings";

export type {
    DspDebuggerOptions,
    DspOptions,
    LoadAudioSourceOptions,
    AudioSourceData,
    ChannelOptions,
    ChannelSpatialization,
    AudioClipEventMap,
    AudioClipEvents,
    AudioClipOnProgressEvent,
    AudioClipAnalyserProperty,
    AudioClipAnalyserType,
    DspPipelineInitializationOptions,
    DspPipelineInitializationState,
    AudioDeviceChangedEvent,
    AudioDeviceLostEvent,
    AudioDeviceListChangedEvent,
    AudioDeviceEventMap,
    InputChannelEventMap,
    InputChannelOptions,
    ChorusEffectOptions,
    LowPassFilterOptions,
    HighPassFilterOptions,
    NotchFilterOptions,
    CompressorOptions,
    LimiterOptions,
    EqualizerBand,
    EqualizerBandType,
    EqualizerOptions,
    MonoDelayOptions,
    PingPongDelayOptions,
    StereoDelayOptions,
    AdvancedDelayOptions,
    SaturationMode,
    SaturationOptions,
    StereoPannerOptions,
    StereoMonoMode,
    StereoMonoOptions,
    StereoSplitMode,
    MultibandCompressorBandName,
    MultibandCompressorBandOptions,
    MultibandCompressorOptions,
    SoftClipOptions,
    HardClipOptions,
    EffectorEventMap,
    IncomingMessageType,
    IncomingProcessorMessage,
    ProcessorData,
    EffectorEvents,
    ArrayPosition,
    Vector2,
    Vector3,
    SpatialDistanceModel,
    SpatialYAxisDirection,
    SpatialPanningModel,
    SpatialAttenuationOptions,
    SpatialAudioSourceOptions,
    SpatialAudioListenerOptions,
    SpatialAudioListener3DOptions,
    SpatialClusteringOptions,
    SpatialAudioRendererOptions,
    SpatialAudioRenderer2DOptions,
    SpatialAudioRenderer3DOptions,
    SpatialSourceState,
} from "./typings";