import { v4 } from "uuid";
import { format } from "date-fns";
import { Debug } from "../../utilities/debugger";
export class AudioClip {
    data;
    id = v4();
    hasAttachedToChannel = false;
    label = null;
    loop = false;
    isPlaying = false;
    startTime = 0;
    offsetAtStart = 0;
    progressUpdateSpeed = 20;
    gainNode = null;
    stereoPannerNode = null;
    parentialAudioContext = null;
    parentialChannel = null;
    preAnalyser = null;
    postAnalyser = null;
    preAnalyserEnabled = false;
    postAnalyserEnabled = false;
    preAnalyserOptions = {};
    postAnalyserOptions = {};
    preAnalyserFloatArrayBuffer = new Float32Array();
    postAnalyserFloatArrayBuffer = new Float32Array();
    preAnalyserByteArrayBuffer = new Uint8Array();
    postAnalyserByteArrayBuffer = new Uint8Array();
    audioBufferSourceNodes = [];
    maxAudioBufferSourceNodes = 1;
    progressInterval = 0;
    events = {
        "progress": []
    };
    constructor(data) {
        this.data = data;
    }
    // Private methods.
    createBufferSource() {
        if (!this.parentialAudioContext)
            return null;
        const context = this.parentialAudioContext;
        const bufferSource = context.createBufferSource();
        bufferSource.buffer = this.data.audioBuffer;
        bufferSource.loop = this.loop;
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
    rebuildNodeChain() {
        if (!this.parentialAudioContext || !this.gainNode || !this.stereoPannerNode || !this.parentialChannel || !this.parentialChannel.audioClipsInputGainNode) {
            Debug.Error("rebuildNodeChain: missing context or core nodes (gain/panner).");
            return false;
        }
        const destination = this.parentialChannel.audioClipsInputGainNode;
        this.safeDisconnect(this.gainNode);
        this.safeDisconnect(this.stereoPannerNode);
        this.safeDisconnect(this.preAnalyser);
        this.safeDisconnect(this.postAnalyser);
        let entry = this.gainNode;
        if (this.preAnalyserEnabled && this.preAnalyser) {
            entry = this.preAnalyser;
            this.preAnalyser.connect(this.gainNode);
        }
        this.gainNode.connect(this.stereoPannerNode);
        if (this.postAnalyserEnabled && this.postAnalyser) {
            this.stereoPannerNode.connect(this.postAnalyser);
            this.postAnalyser.connect(destination);
        }
        else {
            this.stereoPannerNode.connect(destination);
        }
        this.connectSourcesTo(entry);
        return true;
    }
    // Public methods
    InitializeAudioClipOnAttaching(channel) {
        if (!channel.parentialContext || !channel.audioClipsInputGainNode) {
            Debug.Error("Could not initialize audio clip on channel attachment, because channel it's master channel has not been defined.", [
                `Call .AttachChannel([channel<"${channel.id}"> Channel]) on the master channel.`
            ]);
            return null;
        }
        this.gainNode = new GainNode(channel.parentialContext);
        this.stereoPannerNode = new StereoPannerNode(channel.parentialContext);
        this.parentialAudioContext = channel.parentialContext;
        this.parentialChannel = channel;
        this.hasAttachedToChannel = true;
        return this;
    }
    Play(timestamp, offset) {
        if (!this.hasAttachedToChannel || !this.parentialAudioContext || !this.parentialChannel) {
            Debug.Error("Could not play the audio node because it is not attached to a channel", [
                "Call 'AttachAudioClip([clip AudioClip])' on a channel, before playing this audio node."
            ]);
            return this;
        }
        const context = this.parentialAudioContext;
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
            clearInterval(this.progressInterval);
        if (this.isPlaying)
            this.progressInterval = setInterval(function () {
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
        if (!this.parentialAudioContext || !this.hasAttachedToChannel) {
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
    Stop() {
        if (!this.hasAttachedToChannel || !this.parentialAudioContext) {
            Debug.Error("Could not stop the audio node because it is not attached to a channel", [
                "Call 'AttachAudioClip([node AudioNode])' on a channel, before stopping this audio node."
            ]);
            return null;
        }
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
        if (!this.gainNode || !this.parentialAudioContext)
            return Debug.Error("Something went wrong while setting the volume.", [
                `Gain node on audio clip '${this.id}' is undefined.`
            ]);
        this.gainNode.gain.setValueAtTime(volume, this.parentialAudioContext.currentTime);
        return this;
    }
    SetPanLevel(panLevel) {
        if (!this.stereoPannerNode || !this.parentialAudioContext)
            return Debug.Error("Something went wrong while setting the pan level", [
                `Stereo panner node on audio clip '${this.id}' is undefined`
            ]);
        if (panLevel < -1 || panLevel > 1)
            return Debug.Error("Could not set the pan level because it is not between -1 and 1.", [
                "Provide this method with a value between -1 and 1"
            ]);
        this.stereoPannerNode.pan.setValueAtTime(panLevel, this.parentialAudioContext.currentTime);
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
        Debug.Warn("Changing the amount of buffer source nodes may cause some properties of this class instance to work inproperly.", [
            "The default value is 1."
        ]);
        this.maxAudioBufferSourceNodes = value;
        return this;
    }
    DisconnectAllAudioBufferSourceNodes() {
        if (!this.parentialAudioContext)
            return false;
        const contextCurrentTime = this.parentialAudioContext?.currentTime;
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
    EnablePreAnalyser() {
        if (!this.parentialAudioContext || !this.parentialChannel || !this.hasAttachedToChannel) {
            Debug.Error("EnablePreAnalyser: clip niet aan channel gekoppeld.");
            return false;
        }
        if (!this.preAnalyser)
            this.preAnalyser = new AnalyserNode(this.parentialAudioContext, this.preAnalyserOptions);
        this.preAnalyserFloatArrayBuffer = new Float32Array(this.preAnalyser.fftSize);
        this.preAnalyserByteArrayBuffer = new Uint8Array(this.preAnalyser.fftSize);
        this.preAnalyserEnabled = true;
        return this.rebuildNodeChain();
    }
    DisablePreAnalyser() {
        this.preAnalyserEnabled = false;
        return this.rebuildNodeChain();
    }
    EnablePostAnalyser() {
        if (!this.parentialAudioContext || !this.parentialChannel || !this.hasAttachedToChannel) {
            Debug.Error("EnablePostAnalyser: clip niet aan channel gekoppeld.");
            return false;
        }
        if (!this.postAnalyser)
            this.postAnalyser = new AnalyserNode(this.parentialAudioContext, this.postAnalyserOptions);
        this.postAnalyserFloatArrayBuffer = new Float32Array(this.postAnalyser.fftSize);
        this.postAnalyserByteArrayBuffer = new Uint8Array(this.postAnalyser.fftSize);
        this.postAnalyserEnabled = true;
        return this.rebuildNodeChain();
    }
    DisablePostAnalyser() {
        this.postAnalyserEnabled = false;
        return this.rebuildNodeChain();
    }
    SetPreAnalyserOptions(options) {
        this.preAnalyserOptions = { ...options };
        if (!this.preAnalyser)
            return;
        this.preAnalyser.fftSize = options.fftSize ?? this.preAnalyser.fftSize;
        this.preAnalyser.minDecibels = options.minDecibels ?? this.preAnalyser.minDecibels;
        this.preAnalyser.maxDecibels = options.maxDecibels ?? this.preAnalyser.maxDecibels;
        this.preAnalyser.smoothingTimeConstant = options.smoothingTimeConstant ?? this.preAnalyser.smoothingTimeConstant;
    }
    SetPostAnalyserOptions(options) {
        this.postAnalyserOptions = { ...options };
        if (!this.postAnalyser)
            return;
        this.postAnalyser.fftSize = options.fftSize ?? this.postAnalyser.fftSize;
        this.postAnalyser.minDecibels = options.minDecibels ?? this.postAnalyser.minDecibels;
        this.postAnalyser.maxDecibels = options.maxDecibels ?? this.postAnalyser.maxDecibels;
        this.postAnalyser.smoothingTimeConstant = options.smoothingTimeConstant ?? this.postAnalyser.smoothingTimeConstant;
    }
    SetAnalyserOption(analyserType, property, value) {
        const node = analyserType === "pre" ? this.preAnalyser : this.postAnalyser;
        if (node)
            switch (property) {
                case "fftSize":
                    node.fftSize = value;
                    break;
                case "minDecibels":
                    node.minDecibels = value;
                    break;
                case "maxDecibels":
                    node.maxDecibels = value;
                    break;
                case "smoothingTimeConstant":
                    node.smoothingTimeConstant = value;
                    break;
                default: return false;
            }
        const opts = analyserType === "pre" ? this.preAnalyserOptions : this.postAnalyserOptions;
        switch (property) {
            case "fftSize":
                opts.fftSize = value;
                break;
            case "minDecibels":
                opts.minDecibels = value;
                break;
            case "maxDecibels":
                opts.maxDecibels = value;
                break;
            case "smoothingTimeConstant":
                opts.smoothingTimeConstant = value;
                break;
            default: return false;
        }
        return true;
    }
    GetWaveformFloatData(analyserType) {
        if (analyserType === "pre" && this.preAnalyser) {
            this.preAnalyser.getFloatTimeDomainData(this.preAnalyserFloatArrayBuffer);
            return this.preAnalyserFloatArrayBuffer;
        }
        else if (analyserType === "post" && this.postAnalyser) {
            this.postAnalyser.getFloatTimeDomainData(this.postAnalyserFloatArrayBuffer);
            return this.postAnalyserFloatArrayBuffer;
        }
        return null;
    }
    GetWaveformByteData(analyserType) {
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
    get currentPlaybackTime() {
        return (!this.isPlaying || !this.parentialAudioContext)
            ? 0
            : this.offsetAtStart + (this.parentialAudioContext.currentTime - this.startTime);
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
