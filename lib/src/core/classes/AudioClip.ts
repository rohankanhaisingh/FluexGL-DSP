import { v4 } from "uuid";
import { format } from "date-fns";

import { AudioClipAnalyserProperty, AudioClipAnalyserType, AudioClipEventMap, AudioClipEvents, AudioSourceData } from "../../typings";
import { Debug } from "../../utilities/debugger";
import { Channel } from "./Channel";

type ProgressPayload = Parameters<AudioClipEventMap["progress"]>[0];

export class AudioClip {

    public id: string = v4();
    public hasAttachedToChannel: boolean = false;
    public label: string | null = null;

    public loop: boolean = false;
    public isPlaying: boolean = false;
    public startTime: number = 0;
    public offsetAtStart: number = 0;

    public progressUpdateSpeed: number = 20;

    public gainNode: GainNode | null = null;
    public stereoPannerNode: StereoPannerNode | null = null;

    public context: AudioContext | null = null;
    public channel: Channel | null = null;

    public preAnalyser: AnalyserNode | null = null;
    public postAnalyser: AnalyserNode | null = null;

    public preAnalyserEnabled: boolean = false;
    public postAnalyserEnabled: boolean = false;

    public preAnalyserOptions: AnalyserOptions = {};
    public postAnalyserOptions: AnalyserOptions = {};

    public preAnalyserFloatArrayBuffer = new Float32Array();
    public postAnalyserFloatArrayBuffer = new Float32Array();

    public preAnalyserByteArrayBuffer = new Uint8Array();
    public postAnalyserByteArrayBuffer = new Uint8Array();

    private audioBufferSourceNodes: AudioBufferSourceNode[] = [];
    private maxAudioBufferSourceNodes: number = 1;

    private progressInterval: number | null = 0;

    private events: AudioClipEvents = {
        "progress": []
    }

    constructor(public data: AudioSourceData) { }

    // Private methods.

    private createBufferSource(): AudioBufferSourceNode | null {

        if (!this.context) return null;

        const context = this.context;

        const bufferSource = context.createBufferSource();
        bufferSource.buffer = this.data.audioBuffer;
        bufferSource.loop = this.loop;

        return bufferSource;
    }

    private connectSourcesTo(target: AudioNode) {
        for (const src of this.audioBufferSourceNodes) {
            src.disconnect();
            src.connect(target);
        }
    }

    private safeDisconnect(node?: AudioNode | null) {
        node?.disconnect();
    }

    private rebuildNodeChain() {

        if (!this.context || !this.gainNode || !this.stereoPannerNode || !this.channel || !this.channel.input) {

            Debug.Error("rebuildNodeChain: missing context or core nodes (gain/panner).");
            return false;
        }

        const destination = this.channel.input;

        this.safeDisconnect(this.gainNode);
        this.safeDisconnect(this.stereoPannerNode);
        this.safeDisconnect(this.preAnalyser);
        this.safeDisconnect(this.postAnalyser);

        let entry: AudioNode = this.gainNode;

        if (this.preAnalyserEnabled && this.preAnalyser) {

            entry = this.preAnalyser;
            this.preAnalyser.connect(this.gainNode);
        }

        this.gainNode.connect(this.stereoPannerNode);

        if (this.postAnalyserEnabled && this.postAnalyser) {
            this.stereoPannerNode.connect(this.postAnalyser);
            this.postAnalyser.connect(destination);
        } else {
            this.stereoPannerNode.connect(destination);
        }

        this.connectSourcesTo(entry);
        return true;
    }

    // Public methods

    public InitializeAudioClipOnAttaching(channel: Channel): AudioClip | null {

        if (!channel.context || !channel.input) {

            Debug.Error("Could not initialize audio clip on channel attachment, because channel it's master channel has not been defined.", [
                `Call .AttachChannel([channel<"${channel.id}"> Channel]) on the master channel.`
            ]);
            return null;
        }

        this.gainNode = new GainNode(channel.context);
        this.stereoPannerNode = new StereoPannerNode(channel.context);

        this.context = channel.context;
        this.channel = channel;
        this.hasAttachedToChannel = true;

        return this;
    }

    public Play(timestamp?: number, offset?: number): AudioClip | null {

        if (!this.hasAttachedToChannel || !this.context || !this.channel) {
            Debug.Error("Could not play the audio node because it is not attached to a channel", [
                "Call 'AttachAudioClip([clip AudioClip])' on a channel, before playing this audio node."
            ]);
            return this;
        }

        const context = this.context;
        const self = this;

        if (this.audioBufferSourceNodes.length > this.maxAudioBufferSourceNodes - 1) return null;

        const bufferSource: AudioBufferSourceNode | null = this.createBufferSource();

        if (!bufferSource) {
            Debug.Error("Something went wrong.");
            return null;
        }

        const actualOffset = offset ?? this.offsetAtStart ?? 0;

        this.startTime = context.currentTime;
        this.offsetAtStart = actualOffset;
        this.isPlaying = true;

        if (this.progressInterval) clearInterval(this.progressInterval);

        if (this.isPlaying) this.progressInterval = setInterval(function () {

            if (!self.isPlaying) return;

            const current = self.offsetAtStart + (context.currentTime - self.startTime);
            const date: Date = new Date(current * 1000);

            const formattedTime = format(date, "mm:ss");

            const progressPayload: ProgressPayload = {
                current: parseFloat(current.toFixed(2)),
                startTime: self.startTime,
                offset: self.offsetAtStart,
                contextTimestamp: context.currentTime,
                formatted: formattedTime
            }

            self.events.progress.forEach(function (cb: (event: ProgressPayload) => void) {
                cb(progressPayload);
            });
        }, this.progressUpdateSpeed);

        bufferSource.addEventListener("ended", function () {

            const i = self.audioBufferSourceNodes.indexOf(bufferSource);

            bufferSource.disconnect();

            if (i === 0) self.isPlaying = false;

            if (i >= 0)
                return self.audioBufferSourceNodes.splice(i, 1);

        });

        this.audioBufferSourceNodes.push(bufferSource);
        this.rebuildNodeChain();

        bufferSource.start(timestamp ?? this.startTime, actualOffset);

        return this;
    }

    public Seek(seconds: number): AudioClip | null {

        if (!this.context || !this.hasAttachedToChannel) {
            Debug.Error("Could not seek because the clip is not attached to a channel.", [
                `Clip ID: ${this.id}`
            ]);
            return null;
        }

        const clamped = Math.max(0, Math.min(seconds, this.duration));

        if (!this.isPlaying) {
            this.offsetAtStart = clamped;
            return this;
        }

        this.Stop();
        this.Play(undefined, clamped);

        return this;
    }


    public Stop(): AudioClip | null {

        if (!this.hasAttachedToChannel || !this.context) {

            Debug.Error("Could not stop the audio node because it is not attached to a channel", [
                "Call 'AttachAudioClip([node AudioNode])' on a channel, before stopping this audio node."
            ]);

            return null;
        }

        this.audioBufferSourceNodes.forEach(function (node: AudioBufferSourceNode) {

            node.stop();
            node.disconnect();
        });

        this.audioBufferSourceNodes.length = 0;
        this.isPlaying = false;

        if (this.progressInterval) {

            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }

        return this;
    }
    public SetVolume(volume: number): AudioClip | void {

        if (!this.gainNode || !this.context) return Debug.Error("Something went wrong while setting the volume.", [
            `Gain node on audio clip '${this.id}' is undefined.`
        ]);

        this.gainNode.gain.setValueAtTime(volume, this.context.currentTime);

        return this;
    }

    public SetPanLevel(panLevel: number): AudioClip | void {

        if (!this.stereoPannerNode || !this.context) return Debug.Error("Something went wrong while setting the pan level", [
            `Stereo panner node on audio clip '${this.id}' is undefined`
        ]);

        if (panLevel < -1 || panLevel > 1) return Debug.Error("Could not set the pan level because it is not between -1 and 1.", [
            "Provide this method with a value between -1 and 1"
        ]);

        this.stereoPannerNode.pan.setValueAtTime(panLevel, this.context.currentTime);
        return this;
    }

    public Loop(loop?: boolean): AudioClip {

        this.audioBufferSourceNodes.forEach(function (node: AudioBufferSourceNode) {
            node.loop = loop ?? true;
        });

        this.loop = loop ?? true;
        return this;
    }

    public SetMaxAudioBufferSourceNodes(value: number): AudioClip {

        Debug.Warn("Changing the amount of buffer source nodes may cause some properties of this class instance to work inproperly.", [
            "The default value is 1."
        ]);

        this.maxAudioBufferSourceNodes = value;
        return this;
    }

    public DisconnectAllAudioBufferSourceNodes(): boolean {

        if (!this.context) return false;

        const contextCurrentTime: number = this.context?.currentTime;

        this.audioBufferSourceNodes.forEach(function (node: AudioBufferSourceNode) {
            node.stop(contextCurrentTime);
            node.disconnect();
        });

        return true;
    }

    public AddEventListener<K extends keyof AudioClipEventMap>(event: K, cb: AudioClipEventMap[K]): () => void {

        this.events[event].push(cb);

        return () => this.RemoveEventListener(event, cb);
    }

    public Once<K extends keyof AudioClipEventMap>(event: K, cb: AudioClipEventMap[K]): () => void {

        const wrapper = ((...args: unknown[]) => {

            // @ts-ignore
            cb(...args);

            this.RemoveEventListener(event, wrapper as unknown as AudioClipEventMap[K]);
        }) as unknown as AudioClipEventMap[K];

        return this.AddEventListener(event, wrapper);
    }

    public RemoveEventListener<K extends keyof AudioClipEventMap>(event: K, cb: AudioClipEventMap[K]): AudioClip {

        const arr = this.events[event];

        for (let i = 0; i < arr.length; i++) {
            if (arr[i] === cb) {
                arr.splice(i, 1);
                break;
            }
        }
        return this;
    }

    public ClearEventListeners(event?: keyof AudioClipEventMap): AudioClip {

        if (event) {
            this.events[event].length = 0;
        } else {
            (Object.keys(this.events) as (keyof AudioClipEventMap)[]).forEach((k) => (this.events[k].length = 0));
        }

        return this;
    }

    public GetChannelData(channel: number = 0): Float32Array {

        return this.data.audioBuffer.getChannelData(channel);
    }

    public EnablePreAnalyser(): boolean {

        if (!this.context || !this.channel || !this.hasAttachedToChannel) {
            Debug.Error("EnablePreAnalyser: clip niet aan channel gekoppeld.");
            return false;
        }

        if (!this.preAnalyser)
            this.preAnalyser = new AnalyserNode(this.context, this.preAnalyserOptions);

        this.preAnalyserFloatArrayBuffer = new Float32Array(this.preAnalyser.fftSize);
        this.preAnalyserByteArrayBuffer = new Uint8Array(this.preAnalyser.fftSize);

        this.preAnalyserEnabled = true;
        return this.rebuildNodeChain();
    }

    public DisablePreAnalyser() {

        this.preAnalyserEnabled = false;
        return this.rebuildNodeChain();
    }

    public EnablePostAnalyser() {

        if (!this.context || !this.channel || !this.hasAttachedToChannel) {

            Debug.Error("EnablePostAnalyser: clip niet aan channel gekoppeld.");
            return false;
        }

        if (!this.postAnalyser)
            this.postAnalyser = new AnalyserNode(this.context, this.postAnalyserOptions);

        this.postAnalyserFloatArrayBuffer = new Float32Array(this.postAnalyser.fftSize);
        this.postAnalyserByteArrayBuffer = new Uint8Array(this.postAnalyser.fftSize);

        this.postAnalyserEnabled = true;
        return this.rebuildNodeChain();
    }

    public DisablePostAnalyser() {

        this.postAnalyserEnabled = false;
        return this.rebuildNodeChain();
    }

    public SetPreAnalyserOptions(options: AnalyserOptions) {

        this.preAnalyserOptions = { ...options };

        if (!this.preAnalyser) return;

        this.preAnalyser.fftSize = options.fftSize ?? this.preAnalyser.fftSize;
        this.preAnalyser.minDecibels = options.minDecibels ?? this.preAnalyser.minDecibels;
        this.preAnalyser.maxDecibels = options.maxDecibels ?? this.preAnalyser.maxDecibels;
        this.preAnalyser.smoothingTimeConstant = options.smoothingTimeConstant ?? this.preAnalyser.smoothingTimeConstant;
    }

    public SetPostAnalyserOptions(options: AnalyserOptions) {

        this.postAnalyserOptions = { ...options };

        if (!this.postAnalyser) return;

        this.postAnalyser.fftSize = options.fftSize ?? this.postAnalyser.fftSize;
        this.postAnalyser.minDecibels = options.minDecibels ?? this.postAnalyser.minDecibels;
        this.postAnalyser.maxDecibels = options.maxDecibels ?? this.postAnalyser.maxDecibels;
        this.postAnalyser.smoothingTimeConstant = options.smoothingTimeConstant ?? this.postAnalyser.smoothingTimeConstant;
    }

    public SetAnalyserOption(analyserType: AudioClipAnalyserType, property: AudioClipAnalyserProperty, value: number) {

        const node = analyserType === "pre" ? this.preAnalyser : this.postAnalyser;

        if (node) switch (property) {
            case "fftSize": node.fftSize = value as AnalyserNode["fftSize"]; break;
            case "minDecibels": node.minDecibels = value; break;
            case "maxDecibels": node.maxDecibels = value; break;
            case "smoothingTimeConstant": node.smoothingTimeConstant = value; break;
            default: return false;
        }

        const opts = analyserType === "pre" ? this.preAnalyserOptions : this.postAnalyserOptions;

        switch (property) {
            case "fftSize": opts.fftSize = value as AnalyserNode["fftSize"]; break;
            case "minDecibels": opts.minDecibels = value; break;
            case "maxDecibels": opts.maxDecibels = value; break;
            case "smoothingTimeConstant": opts.smoothingTimeConstant = value; break;
            default: return false;
        }

        return true;
    }

    public GetWaveformFloatData(analyserType: AudioClipAnalyserType): Float32Array | null {

        if (analyserType === "pre" && this.preAnalyser) {
            this.preAnalyser.getFloatTimeDomainData(this.preAnalyserFloatArrayBuffer);
            return this.preAnalyserFloatArrayBuffer;
        } else if (analyserType === "post" && this.postAnalyser) {
            this.postAnalyser.getFloatTimeDomainData(this.postAnalyserFloatArrayBuffer);
            return this.postAnalyserFloatArrayBuffer;
        }

        return null;
    }

    public GetWaveformByteData(analyserType: AudioClipAnalyserType): Uint8Array | null {

        if (!this.preAnalyser || !this.postAnalyser) {

            Debug.Error("Could not get byte waveform data because the pre analyser or post analyser has not been enabled.", [
                "Call .EnablePreAnalyser() or .EnablePostAnalyser() before getting waveform data."
            ]);

            return null;
        }

        switch (analyserType) {
            case "pre":
                this.preAnalyser.getByteTimeDomainData(this.preAnalyserByteArrayBuffer);
                return this.preAnalyserByteArrayBuffer;
            case "post":
                this.postAnalyser.getByteTimeDomainData(this.postAnalyserByteArrayBuffer);
                return this.postAnalyserByteArrayBuffer;
            default:
                return null;
        }
    }

    // Public getters and setters

    public get currentPlaybackTime(): number {
        return (!this.isPlaying || !this.context)
            ? 0
            : this.offsetAtStart + (this.context.currentTime - this.startTime);
    }

    public get duration(): number {
        return this.data.audioBuffer.duration;
    }

    public get volume(): number {
        return this.gainNode?.gain.value ?? 0;
    }

    public get stereoPanning(): number {
        return this.stereoPannerNode?.pan.value ?? 1;
    }

    public get formattedDuration(): string {

        const date = new Date(this.duration * 1000);

        return format(date, "mm:ss");
    }

    public get sampleRate(): number {
        return this.data.audioBuffer.sampleRate;
    }

    public get numberOfChannels(): number {
        return this.data.audioBuffer.numberOfChannels;
    }

    public get byteLength(): number {
        return this.data.arrayBuffer.byteLength;
    }
}