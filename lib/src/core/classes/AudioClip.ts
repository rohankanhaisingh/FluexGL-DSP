import { v4 } from "uuid";
import { format } from "date-fns";

import { AudioClipEventMap, AudioClipEvents, AudioSourceData } from "../../typings";
import { Debug } from "../../utilities/debugger";
import { Channel } from "./Channel";
import { AudioClipPlayer } from "./AudioClipPlayer";
import { Master } from "./Master";
import { DSP } from "../../index";
import { ErrorCodes } from "../../console-codes";

type ProgressPayload = Parameters<AudioClipEventMap["progress"]>[0];

export class AudioClip {

    public id: string = v4();
    public label: string | null = null;

    public loop: boolean = false;
    public isPlaying: boolean = false;
    public startTime: number = 0;
    public offsetAtStart: number = 0;
    public playbackRate: number = 1;
    public pitch: number = 0;

    public minPitchSemitones: number = -24;
    public maxPitchSemitones: number = 24;

    public progressUpdateSpeed: number = 20;

    public gainNode: GainNode | null = null;
    public stereoPannerNode: StereoPannerNode | null = null;

    public context: AudioContext | null = null;
    public audioClipPlayer: AudioClipPlayer | null = null;

    private audioBufferSourceNodes: AudioBufferSourceNode[] = [];
    private maxAudioBufferSourceNodes: number = 1;
    private audioClipPlayers: AudioClipPlayer[] = [];

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
        bufferSource.playbackRate.setValueAtTime(this.playbackRate, this.context.currentTime);

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

    private getOutputNodes(): AudioNode[] {

        const nodes: AudioNode[] = [];

        for (const player of this.audioClipPlayers) {
            if (player.outputGainNode && !nodes.includes(player.outputGainNode))
                nodes.push(player.outputGainNode);
        }

        return nodes;
    }

    private rebuildNodeChain(): boolean {

        if (!this.context || !this.gainNode || !this.stereoPannerNode) {
            Debug.Error("Failed to rebuild node chain, because some of the core AudioNodes are missing.");
            return false;
        }

        const destinations = this.getOutputNodes();

        if (destinations.length === 0) {
            Debug.Error("Failed to rebuild node chain, because no output destinations are available.");
            return false;
        }

        this.safeDisconnect(this.gainNode);
        this.safeDisconnect(this.stereoPannerNode);

        this.gainNode.connect(this.stereoPannerNode);
        for (const destination of destinations) {
            this.stereoPannerNode.connect(destination);
        }

        this.connectSourcesTo(this.gainNode);
        return true;
    }

    public initialize(audioClipPlayer: AudioClipPlayer) {

        if (!audioClipPlayer.context) return Debug.Error("Could not initialize AudioClip, because the AudioClipPlayer somehow has no audio context.", [
            `AudioClipPlayer id: ${audioClipPlayer.id}`,
            `AudioClip id: ${this.id}`
        ], ErrorCodes.AUDIO_CLIP_PLAYER_NO_CONTEXT);

        if (this.context && this.context !== audioClipPlayer.context) {
            return Debug.Error("Could not initialize AudioClip, because the AudioClipPlayer does not share the same AudioContext.", [
                `AudioClipPlayer id: ${audioClipPlayer.id}`,
                `AudioClip id: ${this.id}`
            ], ErrorCodes.AUDIO_CLIP_PLAYER_NO_CONTEXT);
        }

        this.audioClipPlayer = audioClipPlayer;
        this.context = audioClipPlayer.context;

        if (!this.gainNode) this.gainNode = new GainNode(this.context);
        if (!this.stereoPannerNode) this.stereoPannerNode = new StereoPannerNode(this.context);

        if (!this.audioClipPlayers.includes(audioClipPlayer))
            this.audioClipPlayers.push(audioClipPlayer);

        this.rebuildNodeChain();
    }

    public play(timestamp?: number, offset?: number) {

        if (!this.context) return Debug.Error("Could not play audio clip, because context (AudioContext) is undefined.", [
            "Make sure to attach this AudioClip to an AudioClipPlayer instance, before calling .play on this AudioClip."
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

        if (this.progressInterval) window.clearInterval(this.progressInterval);

        if (this.isPlaying) this.progressInterval = window.setInterval(function () {

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

    public seek(seconds: number) {

        if (!this.context) return Debug.Error("Could not seek because the context (AudioContext) of this AudioClip is undefined.", [
            `Make sure to attach this AudioClip to an AudioClipPlayer instance before calling .seek on this AudioClip.`,
            `AudioClip id: ${this.id}`
        ]);

        const clamped = Math.max(0, Math.min(seconds, this.duration));

        if (!this.isPlaying) {

            this.offsetAtStart = clamped;

            return this;
        }

        this.stop();
        this.play(undefined, clamped);

        return this;
    }

    public stop(): AudioClip | null {

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

    public setVolume(volume: number): AudioClip {

        if (!this.context) Debug.Error("Could not set volume because the context (AudioContext) of this AudioClip is undefined.", [
            "Make sure to attach this AudioClip to an AudioClipPlayer instance before calling .setVolume() on this AudioClip.",
        ], ErrorCodes.AUDIO_CLIP_PLAYER_NO_CONTEXT);

        this.gainNode?.gain.setValueAtTime(volume, this.context?.currentTime ?? 0);
        return this;
    }

    public setPanLevel(panLevel: number): AudioClip {

        if (!this.context) Debug.Error("Could not set volume because the context (AudioContext) of this AudioClip is undefined.", [
            "Make sure to attach this AudioClip to an AudioClipPlayer instance before calling .setPanLevel() on this AudioClip.",
        ], ErrorCodes.AUDIO_CLIP_PLAYER_NO_CONTEXT);

        if (panLevel < -1 || panLevel > 1) Debug.Error("Could not set the pan level because it is not between -1 and 1.", [
            `Given value: ${panLevel}.`,
            `Accepts a value between -1 and 1. Can be a floating number.`
        ], ErrorCodes.PANNING_OUT_OF_RANGE);

        this.stereoPannerNode?.pan.setValueAtTime(panLevel, this.context?.currentTime ?? 0);
        return this;
    }

    public setLoop(loop?: boolean): AudioClip {

        this.audioBufferSourceNodes.forEach(function (node: AudioBufferSourceNode) {
            node.loop = loop ?? true;
        });

        this.loop = loop ?? true;
        return this;
    }

    public setMaxAudioBufferSourceNodes(value: number): AudioClip {

        if (!DSP.overrideMaxAudioBufferNodes) {
            Debug.Warn("Cannot set maxAudioBufferSourceNodes because the option to override the current maximum value is disabled.", [
                "Set overrideMaxAudioBufferNodes on DSP to true, in order to override the maximum audio buffer source nodes."
            ]);
            return this;
        }

        this.maxAudioBufferSourceNodes = value;
        return this;
    }

    public disconnectAllAudioBufferSourceNodes(): boolean {

        if (!this.context) return false;

        const contextCurrentTime: number = this.context?.currentTime;

        this.audioBufferSourceNodes.forEach(function (node: AudioBufferSourceNode) {
            node.stop(contextCurrentTime);
            node.disconnect();
        });

        return true;
    }

    public addEventListener<K extends keyof AudioClipEventMap>(event: K, cb: AudioClipEventMap[K]): () => void {

        this.events[event].push(cb);
        return () => this.removeEventListener(event, cb);
    }

    public once<K extends keyof AudioClipEventMap>(event: K, cb: AudioClipEventMap[K]): () => void {

        const wrapper = ((...args: unknown[]) => {

            // @ts-ignore
            cb(...args);
            this.removeEventListener(event, wrapper as unknown as AudioClipEventMap[K]);
        }) as unknown as AudioClipEventMap[K];

        return this.addEventListener(event, wrapper);
    }

    public removeEventListener<K extends keyof AudioClipEventMap>(event: K, cb: AudioClipEventMap[K]): AudioClip {

        const arr = this.events[event];

        for (let i = 0; i < arr.length; i++) {
            if (arr[i] === cb) {
                arr.splice(i, 1);
                break;
            }
        }
        return this;
    }

    public clearEventListeners(event?: keyof AudioClipEventMap): AudioClip {

        if (event) {
            this.events[event].length = 0;
        } else {
            (Object.keys(this.events) as (keyof AudioClipEventMap)[]).forEach((k) => (this.events[k].length = 0));
        }

        return this;
    }

    public getChannelData(channel: number = 0): Float32Array {
        return this.data.audioBuffer.getChannelData(channel);
    }

    public send(channel: Channel | Master) {

        if (!channel.audioClipPlayer) return Debug.Error("Could not send AudioClip signal to channel, because the channel's AudioClipPlayer is undefined.", [
            "Make sure to initialize the Channel.",
            `Channel id: ${channel.id}.`,
            `AudioClip id: ${this.id}.`
        ]);

        channel.audioClipPlayer.attachAudioClip(this);
    }

    public unsend(channel: Channel | Master) {

        if (!channel.audioClipPlayer) return Debug.Error("Could not unsend AudioClip signal to channel, because the channel's AudioClipPlayer is undefined.", [
            "Make sure to initialize the Channel.",
            `Channel id: ${channel.id}.`,
            `AudioClip id: ${this.id}.`
        ]);

        channel.audioClipPlayer.detachAudioClip(this);
    }

    public detachFromAudioClipPlayer(audioClipPlayer: AudioClipPlayer): void {

        const idx = this.audioClipPlayers.indexOf(audioClipPlayer);

        if (idx === -1) return;

        this.audioClipPlayers.splice(idx, 1);

        if (this.audioClipPlayer === audioClipPlayer) {
            this.audioClipPlayer = this.audioClipPlayers[0] ?? null;
        }

        if (this.audioClipPlayers.length === 0) {
            this.stop();
            return;
        }

        this.rebuildNodeChain();
    }

    public setPitch(semitones: number): AudioClip {

        if (!this.context) Debug.Error("Could not set pitch because the context (AudioContext) of this AudioClip is undefined.", [
            "Make sure to attach this AudioClip to an AudioClipPlayer instance before calling .setPitch() on this AudioClip.",
        ], ErrorCodes.AUDIO_CLIP_PLAYER_NO_CONTEXT);

        if (semitones < this.minPitchSemitones || semitones > this.maxPitchSemitones) Debug.Error("Could not set the pitch because it is not within the allowed semitone range.", [
            `Given value: ${semitones}.`,
            `Accepts a value between ${this.minPitchSemitones} and ${this.maxPitchSemitones} semitones.`
        ], ErrorCodes.PITCH_OUT_OF_RANGE);

        const calculatedPlaybackRate: number = Math.pow(2, semitones / 12);

        for (const buffer of this.audioBufferSourceNodes) 
            buffer.playbackRate.setValueAtTime(calculatedPlaybackRate, this.context?.currentTime ?? 0);

        this.pitch = semitones;
        this.playbackRate = calculatedPlaybackRate;
        return this;
    }

    public resetPitch(): AudioClip {
        return this.setPitch(0);
    }

    /** @deprecated Use {@link setPitch} instead. */
    public setPlaybackRateInSemitones(semitones: number): AudioClip {
        return this.setPitch(semitones);
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
