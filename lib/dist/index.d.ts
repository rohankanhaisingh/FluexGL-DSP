/**
 * FluexGL Audio
 * A javascript digital audio processor library.
 */
import { FluexGLAudioDescriptor } from "./typings";
export declare const FluexGLAudio: FluexGLAudioDescriptor;
export { Chorus, Analyser, Distortion, Equalizer, Limiter, Saturation, StereoPanner, Compressor, MultibandCompressor, AdvancedDelay, MonoDelay, PingPongDelay, StereoDelay, ChamberReverb, ConvolverReverb, GenericReverb, HallReverb, RoomReverb, SoftClip, LowPassFilter, HardClip } from "./effects/exports";
export { AudioDevice, Channel, Effector, Master, AudioClip, DspPipeline, AudioClipPlayer } from "./core/exports";
export { InitializeDspPipeline, ResolveAudioOutputDevices, ResolveAudioInputDevices, ResolveDefaultAudioInputDevice, ResolveDefaultAudioOutputDevice, LoadAudioSource, LoadAudioSourceFromBlob, LoadWorkletOnAudioDevice, SendMessageToWorklet } from "./utilities/helpers";
export { SUPPORTED_FILE_TYPES } from "./utilities/constants";
export { hasInitializedWasm, } from "./utilities/web-assembly";
export { StrictMode, ProcessorIdentificationCodes, HardClipMessageCommandId, SoftClipMessageCommandId, AudioWorkletProcessorNames, ChorusMessageCommandId, LowPassFilterMessageCommandId } from "./typings";
export type { FluexGLAudioDescriptor, FluexGLAudioDebuggerOptions, FluexGLAudioOptions, LoadAudioSourceOptions, AudioSourceData, ChannelOptions, ChannelSpatialization, AudioClipEventMap, AudioClipEvents, AudioClipOnProgressEvent, AudioClipAnalyserProperty, AudioClipAnalyserType, DspPipelineInitializationOptions, DspPipelineInitializationState, ChorusEffectOptions, LowPassFilterOptions, SoftClipOptions, HardClipOptions, EffectorEventMap, IncomingMessageType, IncomingProcessorMessage, ProcessorData, EffectorEvents, } from "./typings";
//# sourceMappingURL=index.d.ts.map