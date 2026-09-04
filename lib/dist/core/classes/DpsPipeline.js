import { v4 } from "uuid";
import { AudioDevice } from "./AudioDevice";
import { Debug } from "../../utilities/debugger";
import { LoadWebAssemblyModule } from "../../utilities/web-assembly";
import { constructProcessorWorklet, loadWorkletOnAudioDevice } from "../../utilities/helpers";
import { ErrorCodes, WarningCodes } from "../../console-codes";
import { DSP } from "../../index";
/**
 * Represents the digital signal processing (DSP) pipeline responsible for initializing
 * WebAssembly modules, AudioWorklet processors, and resolving audio output devices.
 */
export class DspPipeline {
    /**
     * The path to the WebAssembly module file.
     */
    pathToWasm = null;
    /**
     * The path to the AudioWorklet processor script.
     */
    pathToWorklet = null;
    /**
     * Unique identifier of this DSP pipeline instance.
     */
    id = v4();
    /**
     * Indicates whether the DSP pipeline has been successfully initialized.
     */
    hasInitialized = false;
    /**
     * The generated blob URL containing the AudioWorklet processor code.
     */
    blobUrl = null;
    /**
     * Creates a new instance of the {@link DspPipeline} class.
     *
     * @param options - Initialization options for the DSP pipeline.
     * Must include valid paths to the WebAssembly and AudioWorklet files.
     */
    constructor({ pathToWasm, pathToWorklet, options }) {
        this.pathToWasm = pathToWasm;
        this.pathToWorklet = pathToWorklet;
        // @ts-ignore
        for (const key in options)
            DSP[key] = options[key];
    }
    /**
     * Initializes the DSP pipeline.
     * This is a convenience wrapper around {@link initializeDpsPipeline}.
     *
     * @returns A promise resolving to `true` if the initialization succeeded, otherwise `false`.
     */
    async init() {
        return await this.initializeDpsPipeline();
    }
    /**
     * Performs the full initialization of the DSP pipeline.
     * Loads the WebAssembly module, constructs the AudioWorklet blob URL,
     * and ensures audio access permissions are granted.
     *
     * @returns A promise resolving to `true` when initialization completes successfully, otherwise `false`.
     */
    async initializeDpsPipeline() {
        Debug.log("Attempting to initialize DSP pipeline...");
        const start = Date.now();
        if (!this.pathToWasm || !this.pathToWorklet) {
            Debug.error("Could not initialize DSP pipeline, because the path to the WASM, or the worklet file has not been defined.");
            return false;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            Debug.log(`Found ${stream.getTracks().length} media stream tracks.`);
            // Stop all tracks immediately after verification
            stream.getTracks().forEach((track) => {
                track.stop();
            });
        }
        catch (err) {
            Debug.error("Permission to access media devices has not been granted.", ["Make sure the user has granted FluentGL permission to access media devices."], ErrorCodes.NO_CONTEXT_PERMISSION);
            return false;
        }
        await LoadWebAssemblyModule(this.pathToWasm);
        const workletFileRequest = await fetch(this.pathToWorklet);
        const textContent = await workletFileRequest.text();
        this.blobUrl = constructProcessorWorklet(textContent);
        const end = Date.now();
        const difference = end - start;
        Debug.success(`Successfully initialized DSP pipeline within ${difference}ms.`);
        return (this.hasInitialized = true);
    }
    /**
     * Resolves and initializes the systemâ€™s default audio output device.
     * This method can only be called after the DSP pipeline has been initialized.
     *
     * @returns A promise that resolves with the default {@link AudioDevice} instance,
     * or `null` if no default device was found or initialization failed.
     */
    async resolveDefaultAudioOutputDevice() {
        Debug.log("Attempting to resolve default audio output device...");
        if (!this.hasInitialized || !this.blobUrl) {
            Debug.error("Could not resolve default audio output device, because the required blob URL has not been created.", ["Call await .initializeDpsPipeline() before resolving default audio output device."]);
            return null;
        }
        const audioDeviceInfos = [];
        const devices = await navigator.mediaDevices.enumerateDevices();
        for (let device of devices)
            (device.kind === "audiooutput" && device.deviceId === "default") &&
                audioDeviceInfos.push(device);
        devices.length === 0 &&
            Debug.warn("No default audio device found.", [], WarningCodes.NO_DEFAULT_AUDIO_DEVICE_FOUND);
        const defaultAudioDevice = devices.length === 0 ? null : new AudioDevice(audioDeviceInfos[0]);
        if (!defaultAudioDevice)
            return null;
        await loadWorkletOnAudioDevice(defaultAudioDevice, this.blobUrl);
        return defaultAudioDevice;
    }
    tellMeWhatTheFuckThisWholeLibraryActuallyDoes() {
        return `I wanted to create a web based game and implement advanced audio, but javascript is slow so that's why this library uses Web Assembly. You dont have to use it, unless you know what the fuck you're doing. If you do, god bless you.`;
    }
}
