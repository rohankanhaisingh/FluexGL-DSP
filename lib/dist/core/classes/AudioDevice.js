import { v4 } from "uuid";
import { Master } from "./Master";
import { Channel } from "./Channel";
import { InputChannel } from "./InputChannel";
import { ErrorCodes, WarningCodes } from "../../console-codes";
import { Debug } from "../../utilities/debugger";
/**
 * Converts a device (or device id) to a sink id understood by AudioContext. An empty string means the system's default device.
 */
function toSinkId(device) {
    const deviceId = typeof device === "string" ? device : device?.deviceId ?? "";
    return deviceId === "default" ? "" : deviceId;
}
function createAudioContext(deviceInfo) {
    const sinkId = deviceInfo?.kind === "audiooutput" ? toSinkId(deviceInfo) : "";
    if (sinkId === "")
        return new AudioContext();
    try {
        return new AudioContext({ sinkId });
    }
    catch (err) {
        Debug.warn("Could not create the audio context on the requested output device, falling back to the default output device.", [
            `Device: ${deviceInfo?.label || sinkId}.`,
            `Reason: ${err instanceof Error ? err.message : String(err)}.`
        ], WarningCodes.OUTPUT_DEVICE_SWITCH_UNSUPPORTED);
        return new AudioContext();
    }
}
export class AudioDevice {
    deviceInfo;
    id = v4();
    timestamp = Date.now();
    context;
    masterChannel;
    masterChannels = [];
    inputChannels = [];
    sampleRate;
    maximumFrequency;
    events = {
        "output-device-changed": [],
        "output-device-lost": [],
        "devices-changed": []
    };
    deviceChangeHandler = () => this.handleDeviceChange();
    constructor(deviceInfo = null) {
        this.deviceInfo = deviceInfo;
        this.context = createAudioContext(deviceInfo);
        this.masterChannel = new Master(this.context);
        this.sampleRate = this.context.sampleRate;
        this.maximumFrequency = this.context.sampleRate / 2;
        navigator.mediaDevices?.addEventListener("devicechange", this.deviceChangeHandler);
    }
    ;
    get baseLatency() {
        return this.context.baseLatency;
    }
    get outputLatency() {
        return this.context.outputLatency;
    }
    get state() {
        return this.context.state;
    }
    get currentTime() {
        return this.context.currentTime;
    }
    /**
     * The id of the output device this audio device is currently playing on. An empty string means the system's default output device.
     */
    get outputDeviceId() {
        const sinkId = this.context.sinkId;
        return typeof sinkId === "string" ? sinkId : "";
    }
    /**
     * Whether the browser supports switching the output device of an audio context.
     */
    static get supportsOutputDeviceSelection() {
        return typeof AudioContext !== "undefined" && "setSinkId" in AudioContext.prototype;
    }
    emit(event, data) {
        for (const cb of [...this.events[event]])
            cb(data);
    }
    async handleDeviceChange() {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const event = {
            inputs: devices.filter(d => d.kind === "audioinput"),
            outputs: devices.filter(d => d.kind === "audiooutput"),
            timestamp: Date.now()
        };
        this.emit("devices-changed", event);
        const currentSinkId = this.outputDeviceId;
        // The default device is followed by the browser itself, so only a specific device can get lost.
        if (currentSinkId === "" || event.outputs.some(d => d.deviceId === currentSinkId))
            return;
        const lost = this.deviceInfo;
        Debug.warn("The output device of this audio device has been disconnected, falling back to the default output device.", [
            `Device: ${lost?.label || currentSinkId}.`
        ], WarningCodes.OUTPUT_DEVICE_LOST);
        const lostEvent = { lost, timestamp: Date.now() };
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
    async setOutputDevice(device = null) {
        const context = this.context;
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
        const sinkId = toSinkId(device);
        const previous = this.deviceInfo;
        try {
            await context.setSinkId(sinkId);
        }
        catch (err) {
            Debug.error("Could not switch to the requested output device.", [
                `Device id: ${sinkId || "default"}.`,
                `Reason: ${err instanceof Error ? err.message : String(err)}.`
            ], ErrorCodes.OUTPUT_DEVICE_UNAVAILABLE);
            return false;
        }
        const devices = await navigator.mediaDevices.enumerateDevices();
        this.deviceInfo = devices.find(d => d.kind === "audiooutput" && toSinkId(d) === sinkId)
            ?? (typeof device === "object" ? device : null);
        Debug.success("Switched output device.", [
            `Device: ${this.deviceInfo?.label || sinkId || "default"}.`
        ]);
        const event = { previous, current: this.deviceInfo, timestamp: Date.now() };
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
    async createInputChannel(device = null, label, options) {
        const inputChannel = new InputChannel(this.context, label, options);
        this.inputChannels.push(inputChannel);
        await inputChannel.setInputDevice(device);
        return inputChannel;
    }
    /**
     * Closes the input channel, and removes it from this audio device.
     */
    removeInputChannel(inputChannel) {
        const idx = this.inputChannels.indexOf(inputChannel);
        if (idx === -1)
            return Debug.error("Could not remove the input channel because it is not part of this audio device.", [
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
    async close() {
        navigator.mediaDevices?.removeEventListener("devicechange", this.deviceChangeHandler);
        for (const inputChannel of this.inputChannels)
            inputChannel.close();
        this.inputChannels = [];
        if (this.context.state !== "closed")
            await this.context.close();
    }
    addEventListener(event, cb) {
        this.events[event].push(cb);
        return () => this.removeEventListener(event, cb);
    }
    removeEventListener(event, cb) {
        const arr = this.events[event];
        const idx = arr.indexOf(cb);
        if (idx >= 0)
            arr.splice(idx, 1);
        return this;
    }
    /**
     * Returns the master channel associated with this audio device.
     * The master channel is the main output channel for this audio device, and is used to control the overall volume and other properties of the audio output.
     * @returns
     */
    getMasterChannel() {
        return this.masterChannel;
    }
    /**
     * Sets the master channel for this audio device.
     * The master channel is normally automatically created when the audio device is initialized, but this method allows for the master channel to be changed if needed.
     * @param channel
     * @returns
     */
    setMasterChannel(channel) {
        if (channel.id === this.masterChannel.id)
            return Debug.error("The provided master channel is the same as the current channel.", [
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
    createMasterChannel() {
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
    getContext() {
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
    createChannel(label) {
        return new Channel(this.context, label);
    }
}
