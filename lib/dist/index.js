/**
 * FluexGL Audio
 * A javascript digital audio processor library.
 */
export const DSP = {
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
};
export { Chorus, Analyser, Distortion, Equalizer, Limiter, Saturation, StereoPanner, Compressor, MultibandCompressor, AdvancedDelay, MonoDelay, PingPongDelay, StereoDelay, ChamberReverb, ConvolverReverb, GenericReverb, HallReverb, RoomReverb, SoftClip, LowPassFilter, HardClip } from "./effects/exports";
export { AudioDevice, Channel, Effector, Master, AudioClip, DspPipeline, AudioClipPlayer } from "./core/exports";
export { InitializeDspPipeline, ResolveAudioOutputDevices, ResolveAudioInputDevices, ResolveDefaultAudioInputDevice, ResolveDefaultAudioOutputDevice, LoadAudioSource, LoadAudioSourceFromBlob, LoadWorkletOnAudioDevice, SendMessageToWorklet } from "./utilities/helpers";
export { SUPPORTED_FILE_TYPES } from "./utilities/constants";
export { hasInitializedWasm, } from "./utilities/web-assembly";
export { StrictMode, ProcessorIdentificationCodes, HardClipMessageCommandId, SoftClipMessageCommandId, AudioWorkletProcessorNames, ChorusMessageCommandId, LowPassFilterMessageCommandId, } from "./typings";
