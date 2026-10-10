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
export { Chorus, Analyser, Distortion, Equalizer, Limiter, Saturation, StereoPanner, StereoMono, Compressor, MultibandCompressor, AdvancedDelay, MonoDelay, PingPongDelay, StereoDelay, SoftClip, LowPassFilter, HardClip, HighPassFilter, NotchFilter, Reverb } from "./effects/exports";
export { AudioDevice, Channel, InputChannel, Effector, Master, AudioClip, DspPipeline, AudioClipPlayer, Sound, SoundInstance, SpatialAudioListener, SpatialAudioListener3D, SpatialAudioSource, SpatialAudioRenderer, SpatialAudioRenderer2D, SpatialAudioRenderer3D } from "./core/exports";
export { initializeDspPipeline, listAudioOutputDevices, listAudioInputDevices, findDefaultAudioDevice, watchAudioDevices, resolveAudioOutputDevices, resolveAudioInputDevices, resolveDefaultAudioInputDevice, resolveDefaultAudioOutputDevice, loadAudioSource, loadAudioSourceFromBlob, loadWorkletOnAudioDevice, sendMessageToWorklet } from "./utilities/helpers";
export { SUPPORTED_FILE_TYPES, DEFAULT_SAMPLE_RATE } from "./utilities/constants";
export { hasInitializedWasm, } from "./utilities/web-assembly";
export { StrictMode, ProcessorIdentificationCodes, HardClipMessageCommandId, SoftClipMessageCommandId, AudioWorkletProcessorNames, ChorusMessageCommandId, LowPassFilterMessageCommandId, HighPassFilterMessageCommandId, NotchFilterMessageCommandId, AdvancedDelayMessageCommandId, EqualizerMessageCommandId, SaturationMessageCommandId, } from "./typings";
