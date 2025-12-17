import { AudioDevice } from "./AudioDevice";
import { DspPipelineInitializationOptions } from "../../typings";
/**
 * Represents the digital signal processing (DSP) pipeline responsible for initializing
 * WebAssembly modules, AudioWorklet processors, and resolving audio output devices.
 */
export declare class DspPipeline {
    /**
     * The path to the WebAssembly module file.
     */
    pathToWasm: string | null;
    /**
     * The path to the AudioWorklet processor script.
     */
    pathToWorklet: string | null;
    /**
     * Unique identifier of this DSP pipeline instance.
     */
    id: string;
    /**
     * Indicates whether the DSP pipeline has been successfully initialized.
     */
    hasInitialized: boolean;
    /**
     * The generated blob URL containing the AudioWorklet processor code.
     */
    private blobUrl;
    /**
     * Creates a new instance of the {@link DspPipeline} class.
     *
     * @param options - Initialization options for the DSP pipeline.
     * Must include valid paths to the WebAssembly and AudioWorklet files.
     */
    constructor({ pathToWasm, pathToWorklet, options }: DspPipelineInitializationOptions);
    /**
     * Initializes the DSP pipeline.
     * This is a convenience wrapper around {@link InitializeDpsPipeline}.
     *
     * @returns A promise resolving to `true` if the initialization succeeded, otherwise `false`.
     */
    Init(): Promise<boolean>;
    /**
     * Performs the full initialization of the DSP pipeline.
     * Loads the WebAssembly module, constructs the AudioWorklet blob URL,
     * and ensures audio access permissions are granted.
     *
     * @returns A promise resolving to `true` when initialization completes successfully, otherwise `false`.
     */
    InitializeDpsPipeline(): Promise<boolean>;
    /**
     * Resolves and initializes the system’s default audio output device.
     * This method can only be called after the DSP pipeline has been initialized.
     *
     * @returns A promise that resolves with the default {@link AudioDevice} instance,
     * or `null` if no default device was found or initialization failed.
     */
    ResolveDefaultAudioOutputDevice(): Promise<AudioDevice | null>;
    TellMeWhatTheFuckThisWholeLibraryActuallyDoes(): string;
}
//# sourceMappingURL=DpsPipeline.d.ts.map