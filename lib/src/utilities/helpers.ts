import mime from "mime";
import { v4 } from "uuid";

import { AudioDevice } from "../core/classes/AudioDevice";
import { Master } from "../core/classes/Master";

import { Debug } from "./debugger";
import { SUPPORTED_FILE_TYPES } from "./constants";

import { compiledWebAssemblyModule, LoadWebAssemblyModule } from "./web-assembly";
import { ErrorCodes, WarningCodes } from "../console-codes";

import { LoadAudioSourceOptions, AudioSourceData, DspPipelineInitializationOptions, DspPipelineInitializationState, AudioWorkletProcessorNames } from "../typings";

/**
 * Initializes the DSP pipeline by requesting audio permissions and initializing the WASM module.
 * Very important to call this function and wait for it to complete before using any audio features.
 * 
 * FluexGL DSP cannot be used without calling this function first.
 * @returns 
 */
export async function InitializeDspPipeline(options: DspPipelineInitializationOptions): Promise<DspPipelineInitializationState | null> {
    Debug.Log("Attempting to initialize DSP pipeline...");

    const start: number = Date.now();
    let initialized: boolean = true;

    try {

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        Debug.Log(`Found ${stream.getTracks().length} media stream tracks.`);

        stream.getTracks().forEach(function (track: MediaStreamTrack) {
            track.stop();
        });
    } catch (err) {

        initialized = false;

        Debug.Error("Permission to access media devices has not been granted.", [
            "Make sure the user has granted FluentGL permission to access media devices."
        ], ErrorCodes.NO_CONTEXT_PERMISSION)
    }

    await LoadWebAssemblyModule(options.pathToWasm);

    const workletFileRequest = await fetch(options.pathToWorklet);
    const textContent: string = await workletFileRequest.text();

    const blobUrl: string = ConstructProcessorWorklet(textContent);

    const end: number = Date.now(),
        difference: number = end - start;

    Debug.Success(`Succesfully initialized DSP pipeline within ${difference}ms.`);

    return {
        success: true,
        workletBlobUrl: blobUrl
    };
}

/**
 * Resolves a list of available audio output devices.
 * @returns 
 */
export async function ResolveAudioOutputDevices(): Promise<AudioDevice[]> {

    const devices = await navigator.mediaDevices.enumerateDevices();

    const audioDevices: AudioDevice[] = [];

    for (let device of devices)
        device.kind === "audiooutput" && audioDevices.push(new AudioDevice(device));

    return audioDevices;
}

/**
 * Resolves a list of available audio input devices.
 * @returns 
 */
export async function ResolveAudioInputDevices(): Promise<AudioDevice[]> {

    const devices = await navigator.mediaDevices.enumerateDevices();

    const audioDevices: AudioDevice[] = [];

    for (let device of devices)
        device.kind === "audioinput" && audioDevices.push(new AudioDevice(device));

    return audioDevices;
}

/**
 * Resolves the default audio output device.
 * @returns 
 */
export async function ResolveDefaultAudioOutputDevice(init: DspPipelineInitializationState): Promise<AudioDevice | null> {
    Debug.Log("Attempting to resolve default audio output device...");

    const audioDeviceInfos: MediaDeviceInfo[] = [];
    const devices = await navigator.mediaDevices.enumerateDevices();

    for (let device of devices)
        (device.kind === "audiooutput" && device.deviceId == "default")
            && audioDeviceInfos.push(device);

    devices.length === 0 && Debug.Warn("No default audio device found.", [], WarningCodes.NO_DEFAULT_AUDIO_DEVICE_FOUND);

    const defaultAudioDevice = devices.length === 0 ? null : new AudioDevice(audioDeviceInfos[0]);

    if (!defaultAudioDevice) return null;

    await LoadWorkletOnAudioDevice(defaultAudioDevice, init.workletBlobUrl);

    return defaultAudioDevice;
}

/**
 * Resolves the default audio input device.
 * @returns 
 */
export async function ResolveDefaultAudioInputDevice(init: DspPipelineInitializationState): Promise<AudioDevice | null> {
    Debug.Log("Attempting to resolve default audio output device...");

    const audioDeviceInfos: MediaDeviceInfo[] = [];
    const devices = await navigator.mediaDevices.enumerateDevices();

    for (let device of devices)
        (device.kind === "audioinput" && device.deviceId == "default")
            && audioDeviceInfos.push(device);

    devices.length === 0 && Debug.Warn("No default audio device found.", [], WarningCodes.NO_DEFAULT_AUDIO_DEVICE_FOUND);

    const defaultAudioDevice = devices.length === 0 ? null : new AudioDevice(audioDeviceInfos[0]);

    if (!defaultAudioDevice) return null;

    await LoadWorkletOnAudioDevice(defaultAudioDevice, init.workletBlobUrl);

    return defaultAudioDevice;
}

/**
 * Loads an audio source from a specified path.
 * @param path 
 * @param options 
 * @returns 
 */
export async function LoadAudioSource(path: string, options: Partial<LoadAudioSourceOptions> = { allowForeignFileTypes: false }): Promise<AudioSourceData | null> {

    const extension: string | null = mime.getType(path);

    if (!extension && !options.allowForeignFileTypes) {

        Debug.Error("The file type of the specified file could not be identified.", [
            `Set allowForeignFileTypes to true in the properties to allow foreign or unknown file types.`
        ], ErrorCodes.NO_FILE_TYPE_FOUND);
        return null;
    }

    if (!SUPPORTED_FILE_TYPES.includes(extension as string)) Debug.Warn("The file type of the specified file is unknown and possibly unknown, but will be used anyways.");

    const file = await fetch(path, { method: "get" });

    if (file.status !== 200) {

        Debug.Error("The specified file could not be loaded.", [
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
export async function LoadAudioSourceFromBlob(blob: Blob): Promise<AudioSourceData | null> {

    const tempContext: AudioContext = new AudioContext(),
        arrayBuffer: ArrayBuffer = await blob.arrayBuffer();

    const audioBuffer: AudioBuffer = await tempContext.decodeAudioData(arrayBuffer);

    return {
        id: v4(),
        timestamp: Date.now(),
        audioBuffer, arrayBuffer
    };
}

export function ConstructProcessorWorklet(code: string): string {

    const blob = new Blob([code], {
        type: "application/javascript"
    });

    return URL.createObjectURL(blob);
}

export async function LoadWorkletOnAudioDevice(audioDevice: AudioDevice, workletBlobUrl: string) {
    Debug.Log("Loading worklet modules on master channel...", [`Channel ID: ${audioDevice.id}`]);

    const context: AudioContext = audioDevice.context,
        start: number = Date.now();

    await context.audioWorklet.addModule(workletBlobUrl);

    const end: number = Date.now(),
        difference: number = end - start;

    Debug.Success("Succesfully loaded audio processor worklets into master channel.", [
        `Executed in ${difference}ms.`,
    ]);

    return true;
}

export function SendMessageToWorklet<T, K = any>(node: AudioWorkletNode | null, commandId: T, data: K) {

    if (!node) return false;

    if (typeof data === "number" && !Number.isFinite(data)) {
        Debug.Warn("Refusing to send non-finite numeric value to AudioWorkletNode.", [
            `Command: ${String(commandId)}`,
            `Value: ${String(data)}`
        ]);
        return false;
    }

    node.port.postMessage({ commandId, data });

    return true;
}

export function IsFiniteNumber(value: unknown): value is number {
    return typeof value === "number" && Number.isFinite(value);
}

export function CoerceFiniteNumber(value: unknown, fallback: number): number {
    return IsFiniteNumber(value) ? value : fallback;
}

export function CreateAudioWorkletNode<T = any>(context: AudioContext, name: AudioWorkletProcessorNames | string, data: T) {

    if (!compiledWebAssemblyModule) {
        Debug.Error("Failed to create audio worklet node, because the web assembly module has not been compiled properly.", [
            `Request audio worklet node: ${name}.`
        ], ErrorCodes.WORKLET_NO_WASM_MODULE_INSTANTIATED);
        return null;
    }

    try {
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
    } catch (err) {
        Debug.Error("Failed to create audio worklet node.", [
            `Request audio worklet node: ${name}.`,
            "Make sure you called InitializeDspPipeline/InitializeDpsPipeline and loaded the worklet module on the same AudioContext.",
            String(err)
        ]);
        return null;
    }
}
