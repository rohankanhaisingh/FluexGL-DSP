import { Master } from "./Master";
import { Channel } from "./Channel";
export declare class AudioDevice {
    deviceInfo: MediaDeviceInfo;
    id: string;
    timestamp: number;
    context: AudioContext;
    masterChannel: Master;
    masterChannels: Master[];
    readonly sampleRate: number;
    readonly baseLatency: number;
    readonly outputLatency: number;
    readonly state: AudioContextState;
    readonly currentTime: number;
    readonly maximumFrequency: number;
    constructor(deviceInfo: MediaDeviceInfo);
    /**
     * Returns the master channel associated with this audio device.
     * The master channel is the main output channel for this audio device, and is used to control the overall volume and other properties of the audio output.
     * @returns
     */
    GetMasterChannel(): Master;
    /**
     * Sets the master channel for this audio device.
     * The master channel is normally automatically created when the audio device is initialized, but this method allows for the master channel to be changed if needed.
     * @param channel
     * @returns
     */
    SetMasterChannel(channel: Master): void;
    /**
     * Creates a new master channel based on the this audio device's audio context, and adds it to the master channels array.
     * Normally, an audio device should only have one master channel, but this method allows for multiple master channels to be created and used if needed.
     * @returns
     */
    CreateMasterChannel(): Master;
    /**
     * Returns the audio context associated with this audio device.
     * This method is provided for ease of use, and is a wrapper for the context property.
     *
     * The audio context can vary between audio devices, and is used to create channels and master channels that are associated with this audio device.
     */
    GetContext(): AudioContext;
    /**
     * Creates a new channel based on the this audio device's audio context.
     * This method is a wrapper for the Channel constructor, and is provided for ease of use.
     * In case you want to create a channel with a different audio context, you can use the Channel constructor directly.
     *
     * @example
     * ```
     * const myChannel: Channel = audioDevice.CreateChannel("My Channel");
     * ```
     *
     * @param label
     * @returns
     */
    CreateChannel(label?: string): Channel;
}
//# sourceMappingURL=AudioDevice.d.ts.map