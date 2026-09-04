import mime from "mime";
import { v4 } from "uuid";
import { AudioDevice } from "../core/classes/AudioDevice";
import { Debug } from "./debugger";
import { SUPPORTED_FILE_TYPES } from "./constants";
import { compiledWebAssemblyModule, LoadWebAssemblyModule } from "./web-assembly";
import { ErrorCodes, WarningCodes } from "../console-codes";
/**
 * Initializes the DSP pipeline by requesting audio permissions and initializing the WASM module.
 * Very important to call this function and wait for it to complete before using any audio features.
 *
 * FluexGL DSP cannot be used without calling this function first.
 * @returns
 */
export async function initializeDspPipeline(options) {
    Debug.log("Attempting to initialize DSP pipeline...");
    const start = Date.now();
    let initialized = true;
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        Debug.log(`Found ${stream.getTracks().length} media stream tracks.`);
        stream.getTracks().forEach(function (track) {
            track.stop();
        });
    }
    catch (err) {
        initialized = false;
        Debug.error("Permission to access media devices has not been granted.", [
            "Make sure the user has granted FluentGL permission to access media devices."
        ], ErrorCodes.NO_CONTEXT_PERMISSION);
    }
    await LoadWebAssemblyModule(options.pathToWasm);
    const workletFileRequest = await fetch(options.pathToWorklet);
    const textContent = await workletFileRequest.text();
    const blobUrl = constructProcessorWorklet(textContent);
    const end = Date.now(), difference = end - start;
    Debug.success(`Succesfully initialized DSP pipeline within ${difference}ms.`);
    return {
        success: true,
        workletBlobUrl: blobUrl
    };
}
/**
 * Resolves a list of available audio output devices.
 * @returns
 */
export async function resolveAudioOutputDevices() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const audioDevices = [];
    for (let device of devices)
        device.kind === "audiooutput" && audioDevices.push(new AudioDevice(device));
    return audioDevices;
}
/**
 * Resolves a list of available audio input devices.
 * @returns
 */
export async function resolveAudioInputDevices() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const audioDevices = [];
    for (let device of devices)
        device.kind === "audioinput" && audioDevices.push(new AudioDevice(device));
    return audioDevices;
}
/**
 * Resolves the default audio output device.
 * @returns
 */
export async function resolveDefaultAudioOutputDevice(init) {
    Debug.log("Attempting to resolve default audio output device...");
    const audioDeviceInfos = [];
    const devices = await navigator.mediaDevices.enumerateDevices();
    for (let device of devices)
        (device.kind === "audiooutput" && device.deviceId == "default")
            && audioDeviceInfos.push(device);
    devices.length === 0 && Debug.warn("No default audio device found.", [], WarningCodes.NO_DEFAULT_AUDIO_DEVICE_FOUND);
    const defaultAudioDevice = devices.length === 0 ? null : new AudioDevice(audioDeviceInfos[0]);
    if (!defaultAudioDevice)
        return null;
    await loadWorkletOnAudioDevice(defaultAudioDevice, init.workletBlobUrl);
    return defaultAudioDevice;
}
/**
 * Resolves the default audio input device.
 * @returns
 */
export async function resolveDefaultAudioInputDevice(init) {
    Debug.log("Attempting to resolve default audio output device...");
    const audioDeviceInfos = [];
    const devices = await navigator.mediaDevices.enumerateDevices();
    for (let device of devices)
        (device.kind === "audioinput" && device.deviceId == "default")
            && audioDeviceInfos.push(device);
    devices.length === 0 && Debug.warn("No default audio device found.", [], WarningCodes.NO_DEFAULT_AUDIO_DEVICE_FOUND);
    const defaultAudioDevice = devices.length === 0 ? null : new AudioDevice(audioDeviceInfos[0]);
    if (!defaultAudioDevice)
        return null;
    await loadWorkletOnAudioDevice(defaultAudioDevice, init.workletBlobUrl);
    return defaultAudioDevice;
}
/**
 * Loads an audio source from a specified path.
 * @param path
 * @param options
 * @returns
 */
export async function loadAudioSource(path, options = { allowForeignFileTypes: false }) {
    const extension = mime.getType(path);
    if (!extension && !options.allowForeignFileTypes) {
        Debug.error("The file type of the specified file could not be identified.", [
            `Set allowForeignFileTypes to true in the properties to allow foreign or unknown file types.`
        ], ErrorCodes.NO_FILE_TYPE_FOUND);
        return null;
    }
    if (!SUPPORTED_FILE_TYPES.includes(extension))
        Debug.warn("The file type of the specified file is unknown and possibly unknown, but will be used anyways.");
    const file = await fetch(path, { method: "get" });
    if (file.status !== 200) {
        Debug.error("The specified file could not be loaded.", [
            `Received status code: ${file.status}.`
        ], ErrorCodes.PATH_TO_FILE_NOT_FOUND);
        return null;
    }
    const tempContext = new AudioContext(), arrayBuffer = await file.arrayBuffer(), audioBuffer = await tempContext.decodeAudioData(arrayBuffer);
    // IMPORTANT!
    tempContext.close();
    return {
        arrayBuffer, audioBuffer,
        id: v4(),
        timestamp: Date.now()
    };
}
/**
 * Loads an audio file from a blob.
 */
export async function loadAudioSourceFromBlob(blob) {
    const tempContext = new AudioContext(), arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await tempContext.decodeAudioData(arrayBuffer);
    return {
        id: v4(),
        timestamp: Date.now(),
        audioBuffer, arrayBuffer
    };
}
export function constructProcessorWorklet(code) {
    const blob = new Blob([code], {
        type: "application/javascript"
    });
    return URL.createObjectURL(blob);
}
export async function loadWorkletOnAudioDevice(audioDevice, workletBlobUrl) {
    Debug.log("Loading worklet modules on master channel...", [`Channel ID: ${audioDevice.id}`]);
    const context = audioDevice.context, start = Date.now();
    await context.audioWorklet.addModule(workletBlobUrl);
    const end = Date.now(), difference = end - start;
    Debug.success("Succesfully loaded audio processor worklets into master channel.", [
        `Executed in ${difference}ms.`,
    ]);
    return true;
}
export function sendMessageToWorklet(node, commandId, data) {
    if (!node)
        return false;
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
export function isFiniteNumber(value) {
    return typeof value === "number" && Number.isFinite(value);
}
export function coerceFiniteNumber(value, fallback) {
    return isFiniteNumber(value) ? value : fallback;
}
export function createAudioWorkletNode(context, name, data) {
    if (!compiledWebAssemblyModule)
        throw new Error("Coult not create audio worklet node. WebAssembly has not been compiled yet.");
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
