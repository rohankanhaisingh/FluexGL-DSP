import mime from "mime";
import { v4 } from "uuid";

import { AudioDevice } from "../core/classes/AudioDevice";
import { Master } from "../core/classes/Master";

import { Debug } from "./debugger";
import { SUPPORTED_FILE_TYPES } from "./constants";

import { compiledWebAssemblyModule, LoadWebAssemblyModule } from "./web-assembly";
import { ErrorCodes, WarningCodes } from "../console-codes";

import { LoadAudioSourceOptions, AudioSourceData, DspPipelineInitializationOptions, DspPipelineInitializationState, AudioWorkletProcessorNames, AudioDeviceListChangedEvent } from "../typings";

/**
 * Initializes the DSP pipeline by requesting audio permissions and initializing the WASM module.
 * Very important to call this function and wait for it to complete before using any audio features.
 * 
 * FluexGL DSP cannot be used without calling this function first.
 * @returns 
 */
export async function initializeDspPipeline(options: DspPipelineInitializationOptions): Promise<DspPipelineInitializationState | null> {
    Debug.log("Attempting to initialize DSP pipeline...");

    const start: number = Date.now();
    let initialized: boolean = true;

    try {

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        Debug.log(`Found ${stream.getTracks().length} media stream tracks.`);

        stream.getTracks().forEach(function (track: MediaStreamTrack) {
            track.stop();
        });
    } catch (err) {

        initialized = false;

        Debug.error("Permission to access media devices has not been granted.", [
            "Make sure the user has granted FluentGL permission to access media devices."
        ], ErrorCodes.NO_CONTEXT_PERMISSION)
    }

    await LoadWebAssemblyModule(options.pathToWasm);

    const workletFileRequest = await fetch(options.pathToWorklet);
    const textContent: string = await workletFileRequest.text();

    const blobUrl: string = constructProcessorWorklet(textContent);

    const end: number = Date.now(),
        difference: number = end - start;

    Debug.success(`Succesfully initialized DSP pipeline within ${difference}ms.`);

    return {
        success: true,
        workletBlobUrl: blobUrl
    };
}

/**
 * Returns the available audio output devices. Use these with {@link AudioDevice.setOutputDevice} to switch
 * the output device of an existing audio device, without reloading the page.
 * Device labels are only available after the user granted permission to access media devices.
 */
export async function listAudioOutputDevices(): Promise<MediaDeviceInfo[]> {

    const devices = await navigator.mediaDevices.enumerateDevices();

    return devices.filter(device => device.kind === "audiooutput");
}

/**
 * Returns the available audio input devices, such as microphones and line-ins. Use these with
 * {@link AudioDevice.createInputChannel} or {@link InputChannel.setInputDevice}.
 * Device labels are only available after the user granted permission to access media devices.
 */
export async function listAudioInputDevices(): Promise<MediaDeviceInfo[]> {

    const devices = await navigator.mediaDevices.enumerateDevices();

    return devices.filter(device => device.kind === "audioinput");
}

/**
 * Finds the system's default device of the given kind. Browsers without a "default" device entry (such as Firefox)
 * list the default device first, so the first device of that kind is used as a fallback.
 */
export async function findDefaultAudioDevice(kind: "audioinput" | "audiooutput"): Promise<MediaDeviceInfo | null> {

    const devices = (await navigator.mediaDevices.enumerateDevices()).filter(device => device.kind === kind);

    return devices.find(device => device.deviceId === "default") ?? devices[0] ?? null;
}

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
export function watchAudioDevices(callback: (event: AudioDeviceListChangedEvent) => void): () => void {

    const handler = async function () {

        const devices = await navigator.mediaDevices.enumerateDevices();

        callback({
            inputs: devices.filter(device => device.kind === "audioinput"),
            outputs: devices.filter(device => device.kind === "audiooutput"),
            timestamp: Date.now()
        });
    };

    navigator.mediaDevices.addEventListener("devicechange", handler);

    return () => navigator.mediaDevices.removeEventListener("devicechange", handler);
}

/**
 * Resolves a list of available audio output devices.
 * @deprecated Creates an audio context for every output device. Use {@link listAudioOutputDevices} together with
 * {@link AudioDevice.setOutputDevice} instead.
 * @returns
 */
export async function resolveAudioOutputDevices(): Promise<AudioDevice[]> {

    const devices = await listAudioOutputDevices();

    return devices.map(device => new AudioDevice(device));
}

/**
 * Resolves a list of available audio input devices.
 * @deprecated An input device has no audio context of its own. Use {@link listAudioInputDevices} together with
 * {@link AudioDevice.createInputChannel} instead.
 * @returns
 */
export async function resolveAudioInputDevices(): Promise<AudioDevice[]> {

    const devices = await listAudioInputDevices();

    return devices.map(device => new AudioDevice(device));
}

/**
 * Resolves the default audio output device.
 * @returns
 */
export async function resolveDefaultAudioOutputDevice(init: DspPipelineInitializationState): Promise<AudioDevice | null> {
    Debug.log("Attempting to resolve default audio output device...");

    const deviceInfo: MediaDeviceInfo | null = await findDefaultAudioDevice("audiooutput");

    if (!deviceInfo) {
        Debug.warn("No default audio device found.", [], WarningCodes.NO_DEFAULT_AUDIO_DEVICE_FOUND);
        return null;
    }

    const defaultAudioDevice = new AudioDevice(deviceInfo);

    await loadWorkletOnAudioDevice(defaultAudioDevice, init.workletBlobUrl);

    return defaultAudioDevice;
}

/**
 * Resolves the default audio input device.
 * @deprecated An input device has no audio context of its own. Use {@link findDefaultAudioDevice} with "audioinput",
 * or call {@link AudioDevice.createInputChannel} without a device to open the default input device.
 * @returns
 */
export async function resolveDefaultAudioInputDevice(init: DspPipelineInitializationState): Promise<AudioDevice | null> {
    Debug.log("Attempting to resolve default audio input device...");

    const deviceInfo: MediaDeviceInfo | null = await findDefaultAudioDevice("audioinput");

    if (!deviceInfo) {
        Debug.warn("No default audio device found.", [], WarningCodes.NO_DEFAULT_AUDIO_DEVICE_FOUND);
        return null;
    }

    const defaultAudioDevice = new AudioDevice(deviceInfo);

    await loadWorkletOnAudioDevice(defaultAudioDevice, init.workletBlobUrl);

    return defaultAudioDevice;
}

/**
 * Loads an audio source from a specified path.
 * @param path 
 * @param options 
 * @returns 
 */
export async function loadAudioSource(path: string, options: Partial<LoadAudioSourceOptions> = { allowForeignFileTypes: false }): Promise<AudioSourceData | null> {

    const extension: string | null = mime.getType(path);

    if (!extension && !options.allowForeignFileTypes) {

        Debug.error("The file type of the specified file could not be identified.", [
            `Set allowForeignFileTypes to true in the properties to allow foreign or unknown file types.`
        ], ErrorCodes.NO_FILE_TYPE_FOUND);
        return null;
    }

    if (!SUPPORTED_FILE_TYPES.includes(extension as string)) Debug.warn("The file type of the specified file is unknown and possibly unknown, but will be used anyways.");

    const file = await fetch(path, { method: "get" });

    if (file.status !== 200) {

        Debug.error("The specified file could not be loaded.", [
            `Received status code: ${file.status}.`
        ], ErrorCodes.PATH_TO_FILE_NOT_FOUND);
        return null;
    }

    const tempContext = new AudioContext(),
        arrayBuffer = await file.arrayBuffer(),
        audioBuffer = await tempContext.decodeAudioData(arrayBuffer);

    // IMPORTANT!
    tempContext.close();

    return {
        arrayBuffer, audioBuffer,
        id: v4(),
        timestamp: Date.now()
    }
}

/**
 * Loads an audio file from a blob.
 */
export async function loadAudioSourceFromBlob(blob: Blob): Promise<AudioSourceData | null> {

    const tempContext: AudioContext = new AudioContext(),
        arrayBuffer: ArrayBuffer = await blob.arrayBuffer();

    const audioBuffer: AudioBuffer = await tempContext.decodeAudioData(arrayBuffer);

    // IMPORTANT!
    tempContext.close();

    return {
        id: v4(),
        timestamp: Date.now(),
        audioBuffer, arrayBuffer
    };
}

export function constructProcessorWorklet(code: string): string {

    const blob = new Blob([code], {
        type: "application/javascript"
    });

    return URL.createObjectURL(blob);
}

export async function loadWorkletOnAudioDevice(audioDevice: AudioDevice, workletBlobUrl: string) {
    Debug.log("Loading worklet modules on master channel...", [`Channel ID: ${audioDevice.id}`]);

    const context: AudioContext = audioDevice.context,
        start: number = Date.now();

    await context.audioWorklet.addModule(workletBlobUrl);

    const end: number = Date.now(),
        difference: number = end - start;

    Debug.success("Succesfully loaded audio processor worklets into master channel.", [
        `Executed in ${difference}ms.`,
    ]);

    return true;
}

export function sendMessageToWorklet<T, K = any>(node: AudioWorkletNode | null, commandId: T, data: K) {

    if (!node) return false;

    if (typeof data === "number" && !Number.isFinite(data)) {
        Debug.warn("Refusing to send non-finite numeric value to AudioWorkletNode.", [
            `Command: ${String(commandId)}`,
            `Value: ${String(data)}`
        ]);
        return false;
    }

    node.port.postMessage({ commandId, data });

    return true;
}

export function isFiniteNumber(value: unknown): value is number {
    return typeof value === "number" && Number.isFinite(value);
}

export function coerceFiniteNumber(value: unknown, fallback: number): number {
    return isFiniteNumber(value) ? value : fallback;
}

export function createAudioWorkletNode<T = any>(context: AudioContext, name: AudioWorkletProcessorNames | string, data: T): AudioWorkletNode {

    if (!compiledWebAssemblyModule)
        throw new Error("Coult not create audio worklet node. WebAssembly has not been compiled yet.")

    return new AudioWorkletNode(context, name, {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        outputChannelCount: [2],
        parameterData: {
            ...data,
            sampleRate: context.sampleRate
        },
        processorOptions: {
            module: compiledWebAssemblyModule
        }
    });
}
