import { Channel } from "./Channel";
import { InputChannelEventMap, InputChannelOptions } from "../../typings";
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
export declare class InputChannel extends Channel {
    stream: MediaStream | null;
    sourceNode: MediaStreamAudioSourceNode | null;
    deviceInfo: MediaDeviceInfo | null;
    options: InputChannelOptions;
    private requestCounter;
    /** Whether the stream was opened by this channel. Streams passed to setMediaStream() are owned by the caller and never stopped. */
    private ownsStream;
    /** Muted media element that keeps a remote (WebRTC) stream flowing in Chromium based browsers. */
    private keepAliveElement;
    private readonly trackEndedHandler;
    private events;
    constructor(context: AudioContext, label?: string, options?: Partial<InputChannelOptions>);
    private emit;
    private buildConstraints;
    private releaseSource;
    private attachStream;
    private handleTrackEnded;
    /**
     * Whether this channel is currently receiving a signal from an input device.
     */
    get isOpen(): boolean;
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
    setInputDevice(device?: MediaDeviceInfo | string | null): Promise<boolean>;
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
    setMediaStream(stream: MediaStream): boolean;
    /**
     * Opens the given input device. Alias of {@link setInputDevice}.
     */
    open(device?: MediaDeviceInfo | string | null): Promise<boolean>;
    /**
     * Stops capturing from the input device. The channel itself, its effects and its sends stay intact,
     * so it can be opened again later with {@link setInputDevice}.
     */
    close(): void;
    /**
     * Mutes or unmutes the input device without closing it.
     */
    setMuted(muted: boolean): InputChannel;
    addEventListener<K extends keyof InputChannelEventMap>(event: K, cb: InputChannelEventMap[K]): () => void;
    removeEventListener<K extends keyof InputChannelEventMap>(event: K, cb: InputChannelEventMap[K]): InputChannel;
}
//# sourceMappingURL=InputChannel.d.ts.map