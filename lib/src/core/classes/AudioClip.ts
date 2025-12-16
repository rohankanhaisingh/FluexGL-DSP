import { v4 } from "uuid";
import { format } from "date-fns";

import { AudioClipAnalyserProperty, AudioClipAnalyserType, AudioClipEventMap, AudioClipEvents, AudioSourceData } from "../../typings";
import { Debug } from "../../utilities/debugger";
import { Channel } from "./Channel";
import { AudioClipPlayer } from "./AudioClipPlayer";

type ProgressPayload = Parameters<AudioClipEventMap["progress"]>[0];

export class AudioClip {

    public id: string = v4();
    public label: string | null = null;

    public loop: boolean = false;
    public isPlaying: boolean = false;
    public startTime: number = 0;
    public offsetAtStart: number = 0;

    public progressUpdateSpeed: number = 20;

    public gainNode: GainNode | null = null;
    public stereoPannerNode: StereoPannerNode | null = null;

    public context: AudioContext | null = null;
    public audioClipPlayer: AudioClipPlayer | null = null;

    private audioBufferSourceNodes: AudioBufferSourceNode[] = [];
    private maxAudioBufferSourceNodes: number = 1;

    private progressInterval: number | null = 0;

    private events: AudioClipEvents = {
        "progress": []
    }

    constructor(public data: AudioSourceData) { }

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

    private rebuildNodeChain(): boolean {

        if (!this.context || !this.gainNode || !this.stereoPannerNode || !this.audioClipPlayer || !this.audioClipPlayer.outputGainNode) {
            Debug.Error("Failed to rebuild node chain, because some of the core AudioNodes are missing.");
            return false;
        }

        const destination = this.audioClipPlayer.outputGainNode;

        this.safeDisconnect(this.gainNode);
        this.safeDisconnect(this.stereoPannerNode);

        this.gainNode.connect(this.stereoPannerNode);
        this.stereoPannerNode.connect(destination);

        this.connectSourcesTo(this.gainNode);
        return true;
    }

    public Initialize(audioClipPlayer: AudioClipPlayer) {

        if (!audioClipPlayer.context) return Debug.Error("Could not initialize AudioClip, because the AudioClipPlayer somehow has no audio context.", [
            `AudioClipPlayer id: ${audioClipPlayer.id}`,
            `AudioClip id: ${this.id}`
        ]);

        this.audioClipPlayer = audioClipPlayer;
        this.context = audioClipPlayer.context;

        this.gainNode = new GainNode(this.context);
        this.stereoPannerNode = new StereoPannerNode(this.context);
    }

    public Play(timestamp?: number, offset?: number) {

        if (!this.context) return Debug.Error("Could not play audio clip, because context (AudioContext) is undefined.", [
            "Make sure to attach this AudioClip to an AudioClipPlayer instance, before calling .Play on this AudioClip."
        ]);

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

    public Seek(seconds: number) {

        if (!this.context) return Debug.Error("Could not seek because the context (AudioContext) of this AudioClip is undefined.", [
            `Make sure to attach this AudioClip to an AudioClipPlayer instance before calling .Seek on this AudioClip.`,
            `AudioClip id: ${this.id}`
        ]);

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

    public SetVolume(volume: number): AudioClip {

        if (!this.context) Debug.Error("Could not set volume because the context (AudioContext) of this AudioClip is undefined.", [
            "Make sure to attach this AudioClip to an AudioClipPlayer instance before calling .SetVolume() on this AudioClip.",
        ]);

        if (!this.gainNode) Debug.Error("Could not set volume because the gainNode (GainNode) of this AudioClip is undefined.", [
            "Make sure to attach this AudioClip to an AudioClipPlayer instance before calling .SetVolume() on this AudioClip.",
        ]);

        this.gainNode?.gain.setValueAtTime(volume, this.context?.currentTime ?? 0);
        return this;
    }

    public SetPanLevel(panLevel: number): AudioClip {

        if (!this.context) Debug.Error("Could not set volume because the context (AudioContext) of this AudioClip is undefined.", [
            "Make sure to attach this AudioClip to an AudioClipPlayer instance before calling .SetPanLevel() on this AudioClip.",
        ]);

        if (!this.stereoPannerNode) Debug.Error("Could not set volume because the stereoPannerNode (StereoPannerNode) of this AudioClip is undefined.", [
            "Make sure to attach this AudioClip to an AudioClipPlayer instance before calling .SetPanLevel() on this AudioClip.",
        ]);

        if (panLevel < -1 || panLevel > 1) Debug.Error("Could not set the pan level because it is not between -1 and 1.", [
            `Given value: ${panLevel}.`,
            `Accepts a value between -1 and 1. Can be a floating number.`
        ]);

        this.stereoPannerNode?.pan.setValueAtTime(panLevel, this.context?.currentTime ?? 0);
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