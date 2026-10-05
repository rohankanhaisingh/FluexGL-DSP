import { v4 } from "uuid";

import { Master } from "./Master";
import { Channel } from "./Channel";
import { InputChannel } from "./InputChannel";

import { ErrorCodes, WarningCodes } from "../../console-codes";
import { Debug } from "../../utilities/debugger";
import { AudioDeviceChangedEvent, AudioDeviceEventMap, AudioDeviceEvents, AudioDeviceListChangedEvent, AudioDeviceLostEvent, InputChannelOptions } from "../../typings";

/**
 * AudioContext.setSinkId and AudioContext.sinkId are not (yet) part of the TypeScript DOM typings,
 * and are not supported by every browser.
 */
type SinkAwareAudioContext = AudioContext & {
    readonly sinkId?: string | { type: "none" };
    setSinkId?: (sinkId: string) => Promise<void>;
};

/**
 * Converts a device (or device id) to a sink id understood by AudioContext. An empty string means the system's default device.
 */
function toSinkId(device: MediaDeviceInfo | string | null | undefined): string {

    const deviceId: string = typeof device === "string" ? device : device?.deviceId ?? "";

    return deviceId === "default" ? "" : deviceId;
}

function createAudioContext(deviceInfo: MediaDeviceInfo | null): AudioContext {

    const sinkId: string = deviceInfo?.kind === "audiooutput" ? toSinkId(deviceInfo) : "";

    if (sinkId === "") return new AudioContext();

    try {
        return new AudioContext({ sinkId } as AudioContextOptions);
    } catch (err) {
        Debug.warn("Could not create the audio context on the requested output device, falling back to the default output device.", [
            `Device: ${deviceInfo?.label || sinkId}.`,
            `Reason: ${err instanceof Error ? err.message : String(err)}.`
        ], WarningCodes.OUTPUT_DEVICE_SWITCH_UNSUPPORTED);
        return new AudioContext();
    }
}

export class AudioDevice {

    public id: string = v4();
    public timestamp: number = Date.now();

    public context: AudioContext;

    public masterChannel: Master;
    public masterChannels: Master[] = [];
    public inputChannels: InputChannel[] = [];

    readonly sampleRate: number;
    readonly maximumFrequency: number;

    private events: AudioDeviceEvents = {
        "output-device-changed": [],
        "output-device-lost": [],
        "devices-changed": []
    };

    private readonly deviceChangeHandler = () => this.handleDeviceChange();

    constructor(public deviceInfo: MediaDeviceInfo | null = null) {

        this.context = createAudioContext(deviceInfo);
        this.masterChannel = new Master(this.context);

        this.sampleRate = this.context.sampleRate;
        this.maximumFrequency = this.context.sampleRate / 2;

        navigator.mediaDevices?.addEventListener("devicechange", this.deviceChangeHandler);
    };

    public get baseLatency(): number {
        return this.context.baseLatency;
    }

    public get outputLatency(): number {
        return this.context.outputLatency;
    }

    public get state(): AudioContextState {
        return this.context.state;
    }

    public get currentTime(): number {
        return this.context.currentTime;
    }

    /**
     * The id of the output device this audio device is currently playing on. An empty string means the system's default output device.
     */
    public get outputDeviceId(): string {

        const sinkId = (this.context as SinkAwareAudioContext).sinkId;

        return typeof sinkId === "string" ? sinkId : "";
    }

    /**
     * Whether the browser supports switching the output device of an audio context.
     */
    public static get supportsOutputDeviceSelection(): boolean {
        return typeof AudioContext !== "undefined" && "setSinkId" in AudioContext.prototype;
    }

    private emit<K extends keyof AudioDeviceEventMap>(event: K, data: Parameters<AudioDeviceEventMap[K]>[0]): void {
        for (const cb of [...this.events[event]])
            (cb as (data: unknown) => void)(data);
    }

    private async handleDeviceChange(): Promise<void> {

        const devices: MediaDeviceInfo[] = await navigator.mediaDevices.enumerateDevices();

        const event: AudioDeviceListChangedEvent = {
            inputs: devices.filter(d => d.kind === "audioinput"),
            outputs: devices.filter(d => d.kind === "audiooutput"),
            timestamp: Date.now()
        };

        this.emit("devices-changed", event);

        const currentSinkId: string = this.outputDeviceId;

        // The default device is followed by the browser itself, so only a specific device can get lost.
        if (currentSinkId === "" || event.outputs.some(d => d.deviceId === currentSinkId)) return;

        const lost: MediaDeviceInfo | null = this.deviceInfo;

        Debug.warn("The output device of this audio device has been disconnected, falling back to the default output device.", [
            `Device: ${lost?.label || currentSinkId}.`
        ], WarningCodes.OUTPUT_DEVICE_LOST);

        const lostEvent: AudioDeviceLostEvent = { lost, timestamp: Date.now() };
        this.emit("output-device-lost", lostEvent);

        await this.setOutputDevice(null);
    }

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
    public async setOutputDevice(device: MediaDeviceInfo | string | null = null): Promise<boolean> {

        const context = this.context as SinkAwareAudioContext;

        if (!context.setSinkId) {
            Debug.warn("Could not switch the output device, because this browser does not support AudioContext.setSinkId().", [
                "Check AudioDevice.supportsOutputDeviceSelection before switching output devices."
            ], WarningCodes.OUTPUT_DEVICE_SWITCH_UNSUPPORTED);
            return false;
        }

        if (typeof device === "object" && device !== null && device.kind !== "audiooutput") {
            Debug.error("Could not switch the output device, because the given device is not an output device.", [
                `Received device kind: ${device.kind}.`
            ], ErrorCodes.OUTPUT_DEVICE_UNAVAILABLE);
            return false;
        }

        const sinkId: string = toSinkId(device);
        const previous: MediaDeviceInfo | null = this.deviceInfo;

        try {
            await context.setSinkId(sinkId);
        } catch (err) {
            Debug.error("Could not switch to the requested output device.", [
                `Device id: ${sinkId || "default"}.`,
                `Reason: ${err instanceof Error ? err.message : String(err)}.`
            ], ErrorCodes.OUTPUT_DEVICE_UNAVAILABLE);
            return false;
        }

        const devices: MediaDeviceInfo[] = await navigator.mediaDevices.enumerateDevices();

        this.deviceInfo = devices.find(d => d.kind === "audiooutput" && toSinkId(d) === sinkId)
            ?? (typeof device === "object" ? device : null);

        Debug.success("Switched output device.", [
            `Device: ${this.deviceInfo?.label || sinkId || "default"}.`
        ]);

        const event: AudioDeviceChangedEvent = { previous, current: this.deviceInfo, timestamp: Date.now() };
        this.emit("output-device-changed", event);

        return true;
    }

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
    public async createInputChannel(device: MediaDeviceInfo | string | null = null, label?: string, options?: Partial<InputChannelOptions>): Promise<InputChannel> {

        const inputChannel = new InputChannel(this.context, label, options);

        this.inputChannels.push(inputChannel);

        await inputChannel.setInputDevice(device);

        return inputChannel;
    }

    /**
     * Closes the input channel, and removes it from this audio device.
     */
    public removeInputChannel(inputChannel: InputChannel): void {

        const idx: number = this.inputChannels.indexOf(inputChannel);

        if (idx === -1) return Debug.error("Could not remove the input channel because it is not part of this audio device.", [
            `Input channel id: ${inputChannel.id}.`
        ], ErrorCodes.CHANNEL_NOT_FOUND);

        inputChannel.close();
        inputChannel.unsendFromAll();
        this.inputChannels.splice(idx, 1);
    }

    /**
     * Closes all input channels, stops listening for device changes and closes the audio context.
     * The audio device cannot be used anymore afterwards.
     */
    public async close(): Promise<void> {

        navigator.mediaDevices?.removeEventListener("devicechange", this.deviceChangeHandler);

        for (const inputChannel of this.inputChannels)
            inputChannel.close();

        this.inputChannels = [];

        if (this.context.state !== "closed")
            await this.context.close();
    }

    public addEventListener<K extends keyof AudioDeviceEventMap>(event: K, cb: AudioDeviceEventMap[K]): () => void {
        this.events[event].push(cb);
        return () => this.removeEventListener(event, cb);
    }

    public removeEventListener<K extends keyof AudioDeviceEventMap>(event: K, cb: AudioDeviceEventMap[K]): AudioDevice {

        const arr = this.events[event];
        const idx: number = arr.indexOf(cb);

        if (idx >= 0) arr.splice(idx, 1);
        return this;
    }

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
