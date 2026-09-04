import { AudioDevice } from "../core/classes/AudioDevice";
import { LoadAudioSourceOptions, AudioSourceData, DspPipelineInitializationOptions, DspPipelineInitializationState, AudioWorkletProcessorNames } from "../typings";
/**
 * Initializes the DSP pipeline by requesting audio permissions and initializing the WASM module.
 * Very important to call this function and wait for it to complete before using any audio features.
 *
 * FluexGL DSP cannot be used without calling this function first.
 * @returns
 */
export declare function initializeDspPipeline(options: DspPipelineInitializationOptions): Promise<DspPipelineInitializationState | null>;
/**
 * Resolves a list of available audio output devices.
 * @returns
 */
export declare function resolveAudioOutputDevices(): Promise<AudioDevice[]>;
/**
 * Resolves a list of available audio input devices.
 * @returns
 */
export declare function resolveAudioInputDevices(): Promise<AudioDevice[]>;
/**
 * Resolves the default audio output device.
 * @returns
 */
export declare function resolveDefaultAudioOutputDevice(init: DspPipelineInitializationState): Promise<AudioDevice | null>;
/**
 * Resolves the default audio input device.
 * @returns
 */
export declare function resolveDefaultAudioInputDevice(init: DspPipelineInitializationState): Promise<AudioDevice | null>;
/**
 * Loads an audio source from a specified path.
 * @param path
 * @param options
 * @returns
 */
export declare function loadAudioSource(path: string, options?: Partial<LoadAudioSourceOptions>): Promise<AudioSourceData | null>;
/**
 * Loads an audio file from a blob.
 */
export declare function loadAudioSourceFromBlob(blob: Blob): Promise<AudioSourceData | null>;
export declare function constructProcessorWorklet(code: string): string;
export declare function loadWorkletOnAudioDevice(audioDevice: AudioDevice, workletBlobUrl: string): Promise<boolean>;
export declare function sendMessageToWorklet<T, K = any>(node: AudioWorkletNode | null, commandId: T, data: K): boolean;
export declare function isFiniteNumber(value: unknown): value is number;
export declare function coerceFiniteNumber(value: unknown, fallback: number): number;
export declare function createAudioWorkletNode<T = any>(context: AudioContext, name: AudioWorkletProcessorNames | string, data: T): AudioWorkletNode;
//# sourceMappingURL=helpers.d.ts.map