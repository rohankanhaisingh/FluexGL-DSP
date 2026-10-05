import { Channel } from "./Channel";
import { Debug } from "../../utilities/debugger";
import { ErrorCodes, WarningCodes } from "../../console-codes";
/**
 * A channel that receives its signal from an audio input device, such as a microphone or line-in.
 * Because it extends {@link Channel}, effects, volume, panning and sends work exactly the same as on a normal channel.
 *
 * The input device can be switched at any time with {@link setInputDevice}, without rebuilding the channel,
 * its effects or its sends.
 *
 * Note that the channel is not connected to anything by default. Call `.send(master)` to monitor the input,
 * and be aware that monitoring a microphone through speakers can cause feedback.
 */
export class InputChannel extends Channel {
    stream = null;
    sourceNode = null;
    deviceInfo = null;
    options = {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        channelCount: null,
        fallbackToDefault: true
    };
    requestCounter = 0;
    /** Whether the stream was opened by this channel. Streams passed to setMediaStream() are owned by the caller and never stopped. */
    ownsStream = true;
    /** Muted media element that keeps a remote (WebRTC) stream flowing in Chromium based browsers. */
    keepAliveElement = null;
    trackEndedHandler = () => this.handleTrackEnded();
    events = {
        "input-device-changed": [],
        "input-device-lost": []
    };
    constructor(context, label, options) {
        super(context, label ?? "Input");
        this.options = { ...this.options, ...options };
    }
    emit(event, data) {
        for (const cb of [...this.events[event]])
            cb(data);
    }
    buildConstraints(deviceId) {
        const constraints = {
            echoCancellation: this.options.echoCancellation,
            noiseSuppression: this.options.noiseSuppression,
            autoGainControl: this.options.autoGainControl
        };
        if (deviceId !== "" && deviceId !== "default")
            constraints.deviceId = { exact: deviceId };
        if (this.options.channelCount !== null)
            constraints.channelCount = { ideal: this.options.channelCount };
        return constraints;
    }
    releaseSource() {
        const self = this;
        this.sourceNode?.disconnect();
        this.stream?.getTracks().forEach(function (track) {
            track.removeEventListener("ended", self.trackEndedHandler);
            if (self.ownsStream)
                track.stop();
        });
        if (this.keepAliveElement) {
            this.keepAliveElement.srcObject = null;
            this.keepAliveElement = null;
        }
        this.sourceNode = null;
        this.stream = null;
        this.ownsStream = true;
    }
    attachStream(stream, sourceNode, ownsStream) {
        this.releaseSource();
        this.stream = stream;
        this.sourceNode = sourceNode;
        this.ownsStream = ownsStream;
        this.sourceNode.connect(this.input);
        stream.getAudioTracks()[0]?.addEventListener("ended", this.trackEndedHandler);
    }
    handleTrackEnded() {
        const lost = this.deviceInfo;
        const wasExternalStream = !this.ownsStream;
        Debug.warn("The input device of this input channel has been disconnected.", [
            `Channel id: ${this.id}.`,
            `Device: ${lost?.label || lost?.deviceId || "unknown"}.`
        ], WarningCodes.INPUT_DEVICE_LOST);
        this.releaseSource();
        const event = { lost, timestamp: Date.now() };
        this.emit("input-device-lost", event);
        // An external stream (such as the voice of another player) must never be replaced by the local microphone.
        if (this.options.fallbackToDefault && !wasExternalStream)
            this.setInputDevice(null);
    }
    /**
     * Whether this channel is currently receiving a signal from an input device.
     */
    get isOpen() {
        return !!this.sourceNode;
    }
    /**
     * Opens (or switches to) the given input device. Passing nothing, `null` or `"default"` uses the system's default input device.
     * The new device is opened before the old one is released, so the channel, its effects and its sends stay intact.
     *
     * @example
     * ```
     * const inputs = await listAudioInputDevices();
     * await inputChannel.setInputDevice(inputs[1]);
     * ```
     *
     * @returns `true` when the device has been opened, otherwise `false`.
     */
    async setInputDevice(device = null) {
        if (!this.context || !this.input) {
            Debug.error("Could not open input device because this input channel is not initialized.", [
                `Channel id: ${this.id}.`
            ], ErrorCodes.CHANNEL_NOT_INITIALIZED);
            return false;
        }
        const request = ++this.requestCounter;
        const deviceId = typeof device === "string" ? device : device?.deviceId ?? "";
        let stream;
        let sourceNode;
        try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: this.buildConstraints(deviceId) });
        }
        catch (err) {
            Debug.error("Could not open the requested input device.", [
                `Device id: ${deviceId || "default"}.`,
                `Reason: ${err instanceof Error ? err.message : String(err)}.`
            ], ErrorCodes.INPUT_DEVICE_UNAVAILABLE);
            return false;
        }
        // A newer request was made while this one was waiting, so this stream is no longer needed.
        if (request !== this.requestCounter) {
            stream.getTracks().forEach(track => track.stop());
            return false;
        }
        try {
            sourceNode = new MediaStreamAudioSourceNode(this.context, { mediaStream: stream });
        }
        catch (err) {
            stream.getTracks().forEach(track => track.stop());
            Debug.error("Could not connect the input device to the audio context.", [
                `Reason: ${err instanceof Error ? err.message : String(err)}.`,
                "Some browsers do not support input devices with a different sample rate than the audio context."
            ], ErrorCodes.INPUT_DEVICE_UNAVAILABLE);
            return false;
        }
        const previous = this.deviceInfo;
        this.attachStream(stream, sourceNode, true);
        const track = stream.getAudioTracks()[0];
        // The actual device can differ from the requested one, for example when the default device was requested.
        const actualDeviceId = track?.getSettings().deviceId;
        const devices = await navigator.mediaDevices.enumerateDevices();
        this.deviceInfo = devices.find(d => d.kind === "audioinput" && d.deviceId === actualDeviceId)
            ?? (typeof device === "object" ? device : null);
        Debug.success("Opened input device.", [
            `Channel id: ${this.id}.`,
            `Device: ${this.deviceInfo?.label || actualDeviceId || "default"}.`
        ]);
        const event = { previous, current: this.deviceInfo, timestamp: Date.now() };
        this.emit("input-device-changed", event);
        return true;
    }
    /**
     * Uses an existing MediaStream as input, instead of opening an input device. Use this for audio that
     * does not come from a local device, such as the voice of another player received over WebRTC.
     * Combined with {@link SpatialAudioSource.attachChannel} this gives positioned voice chat (proximity chat).
     *
     * The stream stays owned by the caller: closing this channel does not stop its tracks.
     * When the stream ends, "input-device-lost" is fired, but the channel does not fall back to the local microphone.
     *
     * @example
     * ```
     * peerConnection.addEventListener("track", function (event) {
     *     const voice = new InputChannel(audioDevice.getContext(), "Player 2");
     *     voice.setMediaStream(event.streams[0]);
     *
     *     renderer.createSource({ position: player2.position }).attachChannel(voice);
     * });
     * ```
     *
     * @returns `true` when the stream is connected, otherwise `false`.
     */
    setMediaStream(stream) {
        if (!this.context || !this.input) {
            Debug.error("Could not use the media stream because this input channel is not initialized.", [
                `Channel id: ${this.id}.`
            ], ErrorCodes.CHANNEL_NOT_INITIALIZED);
            return false;
        }
        if (stream.getAudioTracks().length === 0) {
            Debug.error("Could not use the media stream because it has no audio tracks.", [
                `Channel id: ${this.id}.`
            ], ErrorCodes.INPUT_DEVICE_UNAVAILABLE);
            return false;
        }
        let sourceNode;
        try {
            sourceNode = new MediaStreamAudioSourceNode(this.context, { mediaStream: stream });
        }
        catch (err) {
            Debug.error("Could not connect the media stream to the audio context.", [
                `Reason: ${err instanceof Error ? err.message : String(err)}.`
            ], ErrorCodes.INPUT_DEVICE_UNAVAILABLE);
            return false;
        }
        // Cancels pending setInputDevice() calls, so they do not replace this stream.
        this.requestCounter++;
        const previous = this.deviceInfo;
        this.attachStream(stream, sourceNode, false);
        this.deviceInfo = null;
        // Chromium does not deliver remote WebRTC audio to the Web Audio graph unless the stream
        // is also played by a media element. A muted element is enough and is not audible.
        if (typeof Audio !== "undefined") {
            this.keepAliveElement = new Audio();
            this.keepAliveElement.muted = true;
            this.keepAliveElement.srcObject = stream;
            this.keepAliveElement.play().catch(() => { });
        }
        Debug.success("Connected media stream to input channel.", [
            `Channel id: ${this.id}.`
        ]);
        const event = { previous, current: null, timestamp: Date.now() };
        this.emit("input-device-changed", event);
        return true;
    }
    /**
     * Opens the given input device. Alias of {@link setInputDevice}.
     */
    async open(device = null) {
        return this.setInputDevice(device);
    }
    /**
     * Stops capturing from the input device. The channel itself, its effects and its sends stay intact,
     * so it can be opened again later with {@link setInputDevice}.
     */
    close() {
        this.requestCounter++;
        this.releaseSource();
    }
    /**
     * Mutes or unmutes the input device without closing it.
     */
    setMuted(muted) {
        this.stream?.getAudioTracks().forEach(track => track.enabled = !muted);
        return this;
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
}
