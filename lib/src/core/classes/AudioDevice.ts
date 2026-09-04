import { v4 } from "uuid";

import { Master } from "./Master";
import { Channel } from "./Channel";

import { ErrorCodes } from "../../console-codes";
import { Debug } from "../../utilities/debugger";

export class AudioDevice {

    public id: string = v4();
    public timestamp: number = Date.now();

    public context: AudioContext = new AudioContext();

    public masterChannel: Master = new Master(this.context);
    public masterChannels: Master[] = [];

    readonly sampleRate: number = this.context.sampleRate;
    readonly baseLatency: number = this.context.baseLatency;
    readonly outputLatency: number = this.context.outputLatency;
    readonly state: AudioContextState = this.context.state;
    readonly currentTime: number = this.context.currentTime;

    readonly maximumFrequency: number = this.context.sampleRate / 2;

    constructor(public deviceInfo: MediaDeviceInfo) {};

    /**
     * Returns the master channel associated with this audio device.
     * The master channel is the main output channel for this audio device, and is used to control the overall volume and other properties of the audio output.
     * @returns 
     */
    public getMasterChannel(): Master {
        return this.masterChannel;
    }

    /**
     * Sets the master channel for this audio device. 
     * The master channel is normally automatically created when the audio device is initialized, but this method allows for the master channel to be changed if needed.  
     * @param channel 
     * @returns 
     */
    public setMasterChannel(channel: Master): void {

        if (channel.id === this.masterChannel.id) return Debug.error("The provided master channel is the same as the current channel.", [
            "Provide this method with a different master channel.",
            `Received master channel ID ${channel.id}.`
        ], ErrorCodes.SAME_MASTER_CHANNEL);

        this.masterChannel = channel;
    }

    /**
     * Creates a new master channel based on the this audio device's audio context, and adds it to the master channels array.
     * Normally, an audio device should only have one master channel, but this method allows for multiple master channels to be created and used if needed.
     * @returns 
     */
    public createMasterChannel(): Master {

        const master = new Master(this.context);

        this.masterChannels.push(master);
        return master;
    }

    /**
     * Returns the audio context associated with this audio device.
     * This method is provided for ease of use, and is a wrapper for the context property.
     * 
     * The audio context can vary between audio devices, and is used to create channels and master channels that are associated with this audio device.
     */
    public getContext(): AudioContext {
        return this.context;
    }

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
    public createChannel(label?: string): Channel {
        return new Channel(this.context, label);
    }
}