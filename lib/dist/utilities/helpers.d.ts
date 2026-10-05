import { AudioDevice } from "../core/classes/AudioDevice";
import { LoadAudioSourceOptions, AudioSourceData, DspPipelineInitializationOptions, DspPipelineInitializationState, AudioWorkletProcessorNames, AudioDeviceListChangedEvent } from "../typings";
/**
 * Initializes the DSP pipeline by requesting audio permissions and initializing the WASM module.
 * Very important to call this function and wait for it to complete before using any audio features.
 *
 * FluexGL DSP cannot be used without calling this function first.
 * @returns
 */
export declare function initializeDspPipeline(options: DspPipelineInitializationOptions): Promise<DspPipelineInitializationState | null>;
/**
 * Returns the available audio output devices. Use these with {@link AudioDevice.setOutputDevice} to switch
 * the output device of an existing audio device, without reloading the page.
 * Device labels are only available after the user granted permission to access media devices.
 */
export declare function listAudioOutputDevices(): Promise<MediaDeviceInfo[]>;
/**
 * Returns the available audio input devices, such as microphones and line-ins. Use these with
 * {@link AudioDevice.createInputChannel} or {@link InputChannel.setInputDevice}.
 * Device labels are only available after the user granted permission to access media devices.
 */
export declare function listAudioInputDevices(): Promise<MediaDeviceInfo[]>;
/**
 * Finds the system's default device of the given kind. Browsers without a "default" device entry (such as Firefox)
 * list the default device first, so the first device of that kind is used as a fallback.
 */
export declare function findDefaultAudioDevice(kind: "audioinput" | "audiooutput"): Promise<MediaDeviceInfo | null>;
/**
 * Calls the callback every time an audio input or output device is connected or disconnected.
 * Useful to keep a device selection menu up to date.
 *
 * @example
 * ```
 * const stopWatching = watchAudioDevices(function ({ inputs, outputs }) {
 *     renderDeviceMenu(inputs, outputs);
 * });
 * ```
 *
 * @returns A function that stops watching.
 */
export declare function watchAudioDevices(callback: (event: AudioDeviceListChangedEvent) => void): () => void;
/**
 * Resolves a list of available audio output devices.
 * @deprecated Creates an audio context for every output device. Use {@link listAudioOutputDevices} together with
 * {@link AudioDevice.setOutputDevice} instead.
 * @returns
 */
export declare function resolveAudioOutputDevices(): Promise<AudioDevice[]>;
/**
 * Resolves a list of available audio input devices.
 * @deprecated An input device has no audio context of its own. Use {@link listAudioInputDevices} together with
 * {@link AudioDevice.createInputChannel} instead.
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
 * @deprecated An input device has no audio context of its own. Use {@link findDefaultAudioDevice} with "audioinput",
 * or call {@link AudioDevice.createInputChannel} without a device to open the default input device.
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