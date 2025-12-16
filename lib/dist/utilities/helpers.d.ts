import { AudioDevice } from "../core/classes/AudioDevice";
import { LoadAudioSourceOptions, AudioSourceData, DspPipelineInitializationOptions, DspPipelineInitializationState, AudioWorkletProcessorNames } from "../typings";
/**
 * Initializes the DSP pipeline by requesting audio permissions and initializing the WASM module.
 * Very important to call this function and wait for it to complete before using any audio features.
 *
 * FluexGL DSP cannot be used without calling this function first.
 * @returns
 */
export declare function InitializeDspPipeline(options: DspPipelineInitializationOptions): Promise<DspPipelineInitializationState | null>;
/**
 * Resolves a list of available audio output devices.
 * @returns
 */
export declare function ResolveAudioOutputDevices(): Promise<AudioDevice[]>;
/**
 * Resolves a list of available audio input devices.
 * @returns
 */
export declare function ResolveAudioInputDevices(): Promise<AudioDevice[]>;
/**
 * Resolves the default audio output device.
 * @returns
 */
export declare function ResolveDefaultAudioOutputDevice(init: DspPipelineInitializationState): Promise<AudioDevice | null>;
/**
 * Resolves the default audio input device.
 * @returns
 */
export declare function ResolveDefaultAudioInputDevice(init: DspPipelineInitializationState): Promise<AudioDevice | null>;
/**
 * Loads an audio source from a specified path.
 * @param path
 * @param options
 * @returns
 */
export declare function LoadAudioSource(path: string, options?: Partial<LoadAudioSourceOptions>): Promise<AudioSourceData | null>;
/**
 * Loads an audio file from a blob.
 */
export declare function LoadAudioSourceFromBlob(blob: Blob): Promise<AudioSourceData | null>;
export declare function ConstructProcessorWorklet(code: string): string;
export declare function LoadWorkletOnAudioDevice(audioDevice: AudioDevice, workletBlobUrl: string): Promise<boolean>;
export declare function SendMessageToWorklet<T, K = any>(node: AudioWorkletNode | null, commandId: T, data: K): boolean;
export declare function CreateAudioWorkletNode<T = any>(context: AudioContext, name: AudioWorkletProcessorNames | string, data: T): AudioWorkletNode | null;
//# sourceMappingURL=helpers.d.ts.map