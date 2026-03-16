import { v4 } from "uuid";
import { format } from "date-fns";
import { Debug } from "../../utilities/debugger";
import { DSP } from "../../index";
import { ErrorCodes } from "../../console-codes";
export class AudioClip {
    data;
    id = v4();
    label = null;
    loop = false;
    isPlaying = false;
    startTime = 0;
    offsetAtStart = 0;
    playbackRate = 1;
    progressUpdateSpeed = 20;
    gainNode = null;
    stereoPannerNode = null;
    context = null;
    audioClipPlayer = null;
    audioBufferSourceNodes = [];
    maxAudioBufferSourceNodes = 1;
    audioClipPlayers = [];
    progressInterval = 0;
    events = {
        "progress": []
    };
    constructor(data) {
        this.data = data;
    }
    createBufferSource() {
        if (!this.context)
            return null;
        const context = this.context;
        const bufferSource = context.createBufferSource();
        bufferSource.buffer = this.data.audioBuffer;
        bufferSource.loop = this.loop;
        bufferSource.playbackRate.setValueAtTime(this.playbackRate, this.context.currentTime);
        return bufferSource;
    }
    connectSourcesTo(target) {
        for (const src of this.audioBufferSourceNodes) {
            src.disconnect();
            src.connect(target);
        }
    }
    safeDisconnect(node) {
        node?.disconnect();
    }
    getOutputNodes() {
        const nodes = [];
        for (const player of this.audioClipPlayers) {
            if (player.outputGainNode && !nodes.includes(player.outputGainNode))
                nodes.push(player.outputGainNode);
        }
        return nodes;
    }
    rebuildNodeChain() {
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
    Initialize(audioClipPlayer) {
        if (!audioClipPlayer.context)
            return Debug.Error("Could not initialize AudioClip, because the AudioClipPlayer somehow has no audio context.", [
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
        if (!this.gainNode)
            this.gainNode = new GainNode(this.context);
        if (!this.stereoPannerNode)
            this.stereoPannerNode = new StereoPannerNode(this.context);
        if (!this.audioClipPlayers.includes(audioClipPlayer))
            this.audioClipPlayers.push(audioClipPlayer);
        this.rebuildNodeChain();
    }
    Play(timestamp, offset) {
        if (!this.context)
            return Debug.Error("Could not play audio clip, because context (AudioContext) is undefined.", [
                "Make sure to attach this AudioClip to an AudioClipPlayer instance, before calling .Play on this AudioClip."
            ]);
        const context = this.context;
        const self = this;
        if (this.audioBufferSourceNodes.length > this.maxAudioBufferSourceNodes - 1)
            return null;
        const bufferSource = this.createBufferSource();
        if (!bufferSource) {
            Debug.Error("Something went wrong.");
            return null;
        }
        const actualOffset = offset ?? this.offsetAtStart ?? 0;
        this.startTime = context.currentTime;
        this.offsetAtStart = actualOffset;
        this.isPlaying = true;
        if (this.progressInterval)
            window.clearInterval(this.progressInterval);
        if (this.isPlaying)
            this.progressInterval = window.setInterval(function () {
                if (!self.isPlaying)
                    return;
                const current = self.offsetAtStart + (context.currentTime - self.startTime);
                const date = new Date(current * 1000);
                const formattedTime = format(date, "mm:ss");
                const progressPayload = {
                    current: parseFloat(current.toFixed(2)),
                    startTime: self.startTime,
                    offset: self.offsetAtStart,
                    contextTimestamp: context.currentTime,
                    formatted: formattedTime
                };
                self.events.progress.forEach(function (cb) {
                    cb(progressPayload);
                });
            }, this.progressUpdateSpeed);
        bufferSource.addEventListener("ended", function () {
            const i = self.audioBufferSourceNodes.indexOf(bufferSource);
            bufferSource.disconnect();
            if (i === 0)
                self.isPlaying = false;
            if (i >= 0)
                return self.audioBufferSourceNodes.splice(i, 1);
        });
        this.audioBufferSourceNodes.push(bufferSource);
        this.rebuildNodeChain();
        bufferSource.start(timestamp ?? this.startTime, actualOffset);
        return this;
    }
    Seek(seconds) {
        if (!this.context)
            return Debug.Error("Could not seek because the context (AudioContext) of this AudioClip is undefined.", [
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
    Stop() {
        this.audioBufferSourceNodes.forEach(function (node) {
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
    SetVolume(volume) {
        if (!this.context)
            Debug.Error("Could not set volume because the context (AudioContext) of this AudioClip is undefined.", [
                "Make sure to attach this AudioClip to an AudioClipPlayer instance before calling .SetVolume() on this AudioClip.",
            ], ErrorCodes.AUDIO_CLIP_PLAYER_NO_CONTEXT);
        this.gainNode?.gain.setValueAtTime(volume, this.context?.currentTime ?? 0);
        return this;
    }
    SetPanLevel(panLevel) {
        if (!this.context)
            Debug.Error("Could not set volume because the context (AudioContext) of this AudioClip is undefined.", [
                "Make sure to attach this AudioClip to an AudioClipPlayer instance before calling .SetPanLevel() on this AudioClip.",
            ], ErrorCodes.AUDIO_CLIP_PLAYER_NO_CONTEXT);
        if (panLevel < -1 || panLevel > 1)
            Debug.Error("Could not set the pan level because it is not between -1 and 1.", [
                `Given value: ${panLevel}.`,
                `Accepts a value between -1 and 1. Can be a floating number.`
            ], ErrorCodes.PANNING_OUT_OF_RANGE);
        this.stereoPannerNode?.pan.setValueAtTime(panLevel, this.context?.currentTime ?? 0);
        return this;
    }
    Loop(loop) {
        this.audioBufferSourceNodes.forEach(function (node) {
            node.loop = loop ?? true;
        });
        this.loop = loop ?? true;
        return this;
    }
    SetMaxAudioBufferSourceNodes(value) {
        if (!DSP.overrideMaxAudioBufferNodes) {
            Debug.Warn("Cannot set maxAudioBufferSourceNodes because the option to override the current maximum value is disabled.", [
                "Set overrideMaxAudioBufferNodes on DSP to true, in order to override the maximum audio buffer source nodes."
            ]);
            return this;
        }
        this.maxAudioBufferSourceNodes = value;
        return this;
    }
    DisconnectAllAudioBufferSourceNodes() {
        if (!this.context)
            return false;
        const contextCurrentTime = this.context?.currentTime;
        this.audioBufferSourceNodes.forEach(function (node) {
            node.stop(contextCurrentTime);
            node.disconnect();
        });
        return true;
    }
    AddEventListener(event, cb) {
        this.events[event].push(cb);
        return () => this.RemoveEventListener(event, cb);
    }
    Once(event, cb) {
        const wrapper = ((...args) => {
            // @ts-ignore
            cb(...args);
            this.RemoveEventListener(event, wrapper);
        });
        return this.AddEventListener(event, wrapper);
    }
    RemoveEventListener(event, cb) {
        const arr = this.events[event];
        for (let i = 0; i < arr.length; i++) {
            if (arr[i] === cb) {
                arr.splice(i, 1);
                break;
            }
        }
        return this;
    }
    ClearEventListeners(event) {
        if (event) {
            this.events[event].length = 0;
        }
        else {
            Object.keys(this.events).forEach((k) => (this.events[k].length = 0));
        }
        return this;
    }
    GetChannelData(channel = 0) {
        return this.data.audioBuffer.getChannelData(channel);
    }
    Send(channel) {
        if (!channel.audioClipPlayer)
            return Debug.Error("Could not send AudioClip signal to channel, because the channel's AudioClipPlayer is undefined.", [
                "Make sure to initialize the Channel.",
                `Channel id: ${channel.id}.`,
                `AudioClip id: ${this.id}.`
            ]);
        channel.audioClipPlayer.AttachAudioClip(this);
    }
    Unsend(channel) {
        if (!channel.audioClipPlayer)
            return Debug.Error("Could not unsend AudioClip signal to channel, because the channel's AudioClipPlayer is undefined.", [
                "Make sure to initialize the Channel.",
                `Channel id: ${channel.id}.`,
                `AudioClip id: ${this.id}.`
            ]);
        channel.audioClipPlayer.DetachAudioClip(this);
    }
    DetachFromAudioClipPlayer(audioClipPlayer) {
        const idx = this.audioClipPlayers.indexOf(audioClipPlayer);
        if (idx === -1)
            return;
        this.audioClipPlayers.splice(idx, 1);
        if (this.audioClipPlayer === audioClipPlayer) {
            this.audioClipPlayer = this.audioClipPlayers[0] ?? null;
        }
        if (this.audioClipPlayers.length === 0) {
            this.Stop();
            return;
        }
        this.rebuildNodeChain();
    }
    SetPlaybackRateInSemitones(semitones) {
        if (!this.context)
            throw new Error("Could not set playback rate because the AudioContext is not defined.");
        const calculatedPlaybackRate = Math.pow(2, semitones / 12);
        for (const buffer of this.audioBufferSourceNodes) {
            buffer.playbackRate.setValueAtTime(calculatedPlaybackRate, this.context?.currentTime);
        }
        this.playbackRate = calculatedPlaybackRate;
        return this;
    }
    get currentPlaybackTime() {
        return (!this.isPlaying || !this.context)
            ? 0
            : this.offsetAtStart + (this.context.currentTime - this.startTime);
    }
    get duration() {
        return this.data.audioBuffer.duration;
    }
    get volume() {
        return this.gainNode?.gain.value ?? 0;
    }
    get stereoPanning() {
        return this.stereoPannerNode?.pan.value ?? 1;
    }
    get formattedDuration() {
        const date = new Date(this.duration * 1000);
        return format(date, "mm:ss");
    }
    get sampleRate() {
        return this.data.audioBuffer.sampleRate;
    }
    get numberOfChannels() {
        return this.data.audioBuffer.numberOfChannels;
    }
    get byteLength() {
        return this.data.arrayBuffer.byteLength;
    }
}
