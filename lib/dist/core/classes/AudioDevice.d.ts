import { Master } from "./Master";
import { Channel } from "./Channel";
import { InputChannel } from "./InputChannel";
import { AudioDeviceEventMap, InputChannelOptions } from "../../typings";
export declare class AudioDevice {
    deviceInfo: MediaDeviceInfo | null;
    id: string;
    timestamp: number;
    context: AudioContext;
    masterChannel: Master;
    masterChannels: Master[];
    inputChannels: InputChannel[];
    readonly sampleRate: number;
    readonly maximumFrequency: number;
    private events;
    private readonly deviceChangeHandler;
    constructor(deviceInfo?: MediaDeviceInfo | null);
    get baseLatency(): number;
    get outputLatency(): number;
    get state(): AudioContextState;
    get currentTime(): number;
    /**
     * The id of the output device this audio device is currently playing on. An empty string means the system's default output device.
     */
    get outputDeviceId(): string;
    /**
     * Whether the browser supports switching the output device of an audio context.
     */
    static get supportsOutputDeviceSelection(): boolean;
    private emit;
    private handleDeviceChange;
    /**
     * Switches the output device this audio device plays on, without recreating the audio context.
     * Master channels, channels, effects and audio clips keep working, so there is no need to reload the page.
     * Passing nothing, `null` or `"default"` switches to the system's default output device.
     *
     * Requires a browser that supports `AudioContext.setSinkId()`.
     *
     * @example
     * ```
     * const outputs = await listAudioOutputDevices();
     * await audioDevice.setOutputDevice(outputs[1]);
     * ```
     *
     * @returns `true` when the output device has been switched, otherwise `false`.
     */
    setOutputDevice(device?: MediaDeviceInfo | string | null): Promise<boolean>;
    /**
     * Creates a new {@link InputChannel} on this audio device's audio context, and opens the given input device on it.
     * Passing nothing, `null` or `"default"` uses the system's default input device.
     *
     * The input channel is not connected to anything by default. Use `.send()` to route it to a channel or master channel.
     *
     * @example
     * ```
     * const microphone = await audioDevice.createInputChannel(null, "Microphone");
     * microphone.send(audioDevice.getMasterChannel());
     *
     * // Later on, switch to another input device without rebuilding anything.
     * await microphone.setInputDevice(otherInputDevice);
     * ```
     */
    createInputChannel(device?: MediaDeviceInfo | string | null, label?: string, options?: Partial<InputChannelOptions>): Promise<InputChannel>;
    /**
     * Closes the input channel, and removes it from this audio device.
     */
    removeInputChannel(inputChannel: InputChannel): void;
    /**
     * Closes all input channels, stops listening for device changes and closes the audio context.
     * The audio device cannot be used anymore afterwards.
     */
    close(): Promise<void>;
    addEventListener<K extends keyof AudioDeviceEventMap>(event: K, cb: AudioDeviceEventMap[K]): () => void;
    removeEventListener<K extends keyof AudioDeviceEventMap>(event: K, cb: AudioDeviceEventMap[K]): AudioDevice;
    /**
     * Returns the master channel associated with this audio device.
     * The master channel is the main output channel for this audio device, and is used to control the overall volume and other properties of the audio output.
     * @returns
     */
    getMasterChannel(): Master;
    /**
     * Sets the master channel for this audio device.
     * The master channel is normally automatically created when the audio device is initialized, but this method allows for the master channel to be changed if needed.
     * @param channel
     * @returns
     */
    setMasterChannel(channel: Master): void;
    /**
     * Creates a new master channel based on the this audio device's audio context, and adds it to the master channels array.
     * Normally, an audio device should only have one master channel, but this method allows for multiple master channels to be created and used if needed.
     * @returns
     */
    createMasterChannel(): Master;
    /**
     * Returns the audio context associated with this audio device.
     * This method is provided for ease of use, and is a wrapper for the context property.
     *
     * The audio context can vary between audio devices, and is used to create channels and master channels that are associated with this audio device.
     */
    getContext(): AudioContext;
    /**
     * Creates a new channel based on the this audio device's audio context.
     * This method is a wrapper for the Channel constructor, and is provided for ease of use.
     * In case you want to create a channel with a different audio context, you can use the Channel constructor directly.
     *
     * @example
     * ```
     * const myChannel: Channel = audioDevice.createChannel("My Channel");
     * ```
     *
     * @param label
     * @returns
     */
    createChannel(label?: string): Channel;
}
//# sourceMappingURL=AudioDevice.d.ts.map