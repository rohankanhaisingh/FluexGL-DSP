import { v4 } from "uuid";
import { Debug } from "../../utilities/debugger";
export class Channel {
    options;
    id = v4();
    effects = [];
    label;
    parentialContext = null;
    parentialMasterChannel = null;
    audioClips = [];
    gainNode = null;
    stereoPannerNode = null;
    analyserNode = null;
    channelSplitterNode = null;
    analyserFloatArrayBuffer = new Float32Array();
    analyserByteArrayBuffer = new Uint8Array();
    audioClipsInputGainNode = null;
    analyserOptions = { fftSize: 32 };
    constructor(options = { maxAudioNodes: 8, maxEffects: 8 }) {
        this.options = options;
        this.label = options.label ?? null;
    }
    rebuildEffectChain() {
        Debug.Log("Attempting to rebuild effect chain.");
        if (!this.audioClipsInputGainNode || !this.gainNode)
            return Debug.Error("Could not rebuild effect chain, because one or more gain nodes on this channel are undefined.", [
                `Channel id: ${this.id}.`,
                `Current amount of effects: ${this.effects.length}.`
            ]);
        this.audioClipsInputGainNode.disconnect();
        for (const effect of this.effects) {
            effect.audioWorkletNode?.disconnect();
        }
        const activeEffects = this.effects.filter(e => !!e.audioWorkletNode);
        if (activeEffects.length === 0) {
            this.audioClipsInputGainNode.connect(this.gainNode);
        }
        else {
            const firstEffectGain = activeEffects[0].audioWorkletNode;
            this.audioClipsInputGainNode.connect(firstEffectGain);
            for (let i = 0; i < activeEffects.length - 1; i++) {
                const current = activeEffects[i].audioWorkletNode;
                const next = activeEffects[i + 1].audioWorkletNode;
                current.connect(next);
            }
            const lastEffectGain = activeEffects[activeEffects.length - 1].audioWorkletNode;
            lastEffectGain.connect(this.gainNode);
        }
        Debug.Success("Successfully rebuilt effect chain.", [
            `Channel id: ${this.id}.`,
            `Current amount of effects: ${this.effects.length}`
        ]);
    }
    InitializeChannelOnMasterAttachment(master) {
        this.parentialMasterChannel = master;
        this.parentialContext = master.context;
        this.gainNode = new GainNode(this.parentialContext);
        this.stereoPannerNode = new StereoPannerNode(this.parentialContext);
        this.analyserNode = new AnalyserNode(this.parentialContext, this.analyserOptions);
        this.analyserFloatArrayBuffer = new Float32Array(this.analyserNode.fftSize);
        this.analyserByteArrayBuffer = new Uint8Array(this.analyserNode.fftSize);
        this.audioClipsInputGainNode = new GainNode(this.parentialContext);
        this.audioClipsInputGainNode.connect(this.stereoPannerNode);
        this.stereoPannerNode.connect(this.gainNode);
        this.gainNode.connect(this.analyserNode);
        this.analyserNode.connect(this.parentialMasterChannel.gainNode);
    }
    SetLabel(label) {
        this.options.label = label;
        this.label = label;
    }
    ClearLabel() {
        this.options.label = "";
        this.label = null;
    }
    AttachAudioClip(clip) {
        if (this.audioClips.includes(clip))
            return Debug.Error("Could not attach audio clip because it is already part of this channel", [
                "Call .DetachAudioClip([clip AudioClip]) before attaching audio clip."
            ]);
        clip.InitializeAudioClipOnAttaching(this);
        this.audioClips.push(clip);
    }
    DetachAudioClip(clip) {
        if (!this.audioClips.includes(clip))
            return Debug.Error("Could not detach audio clip, because it is not part of this channel.", [
                "Call .AttachAudioClip([clip AudioClip]) before deattaching audio clip."
            ]);
        const self = this;
        clip.parentialAudioContext = null;
        clip.parentialChannel = null;
        clip.hasAttachedToChannel = false;
        clip.stereoPannerNode?.disconnect();
        clip.gainNode?.disconnect();
        clip.DisconnectAllAudioBufferSourceNodes();
        this.audioClips.forEach(function (_clip, index) {
            if (clip.id === _clip.id)
                return self.audioClips.splice(index, 1);
        });
    }
    HasAudioClip(clip) {
        for (let _clip of this.audioClips) {
            if (_clip.id === clip.id)
                return true;
        }
        return false;
    }
    SetVolume(volume) {
        if (!this.gainNode)
            return Debug.Error("Could not set channel volume because the channel is not attached to a master channel.", [
                "Attach the channel to a master channel before setting the volume."
            ]);
        this.gainNode.gain.setValueAtTime(volume, this.parentialContext.currentTime);
    }
    SetPanLevel(pan) {
        if (!this.stereoPannerNode)
            return Debug.Error("Could not set channel pan level because the channel is not attached to a master channel.", [
                "Attach the channel to a master channel before setting the pan level."
            ]);
        this.stereoPannerNode.pan.setValueAtTime(pan, this.parentialContext.currentTime);
    }
    AddEffect(effect) {
        if (!this.parentialContext)
            return Debug.Error("Could not add effect on channel, because the parential context is undefined.", [
                `Channel ID: ${this.id}`,
                `Effect ID: ${effect.id}`,
                `Effect name: ${effect.constructor.name}`
            ]);
        if (this.effects.includes(effect))
            return Debug.Error("Could not add effect because it is already part of this channel", [
                "Call .RemoveEffect([effect Effector]) before adding effect."
            ]);
        effect.InitializeOnAttachment(this.parentialContext);
        this.effects.push(effect);
        this.rebuildEffectChain();
    }
    AttachEffect(effect) {
        return this.AddEffect(effect);
    }
    RemoveEffect(effect) {
        if (!this.effects.includes(effect))
            return Debug.Error("Could not remove effect, because it is not part of this channel.", [
                "Call .AddEffect([effect Effector]) before removing effect."
            ]);
        const self = this;
        this.effects.forEach(function (_effect, index) {
            if (effect.id === _effect.id)
                return self.effects.splice(index, 1);
        });
        this.rebuildEffectChain();
    }
    DetachEffect(effect) {
        return this.RemoveEffect(effect);
    }
    SetAnalyserFftSize(value) {
        if (!this.analyserNode) {
            Debug.Error("Could not set FFT size on analyser because the analyser has not been defined.");
            return null;
        }
        this.analyserNode.fftSize = value;
        this.analyserFloatArrayBuffer = new Float32Array(this.analyserNode.fftSize);
        this.analyserByteArrayBuffer = new Uint8Array(this.analyserNode.fftSize);
        return this.analyserNode.fftSize;
    }
    GetWaveformFloatData() {
        if (!this.analyserNode) {
            Debug.Error("Could not get waveform float data, because the analyser has not been defined.");
            return null;
        }
        if (this.analyserFloatArrayBuffer.length !== this.analyserNode.fftSize) {
            this.analyserFloatArrayBuffer = new Float32Array(this.analyserNode.fftSize);
        }
        this.analyserNode.getFloatTimeDomainData(this.analyserFloatArrayBuffer);
        return this.analyserFloatArrayBuffer;
    }
    GetWaveformByteData() {
        if (!this.analyserNode) {
            Debug.Error("Could not get waveform byte data, because the analyser has not been defined.");
            return null;
        }
        if (this.analyserByteArrayBuffer.length !== this.analyserNode.fftSize) {
            this.analyserByteArrayBuffer = new Uint8Array(this.analyserNode.fftSize);
        }
        this.analyserNode.getByteTimeDomainData(this.analyserByteArrayBuffer);
        return this.analyserByteArrayBuffer;
    }
    SetAnalyserOptions(options) {
        this.analyserOptions = { ...options };
        if (!this.analyserNode)
            return null;
        this.analyserNode.minDecibels = options.minDecibels ?? this.analyserNode.minDecibels;
        this.analyserNode.maxDecibels = options.maxDecibels ?? this.analyserNode.maxDecibels;
        this.analyserNode.fftSize = options.fftSize ?? 32;
        this.analyserNode.smoothingTimeConstant = options.smoothingTimeConstant ?? this.analyserNode.smoothingTimeConstant;
        this.analyserByteArrayBuffer = new Uint8Array(this.analyserNode.fftSize);
        this.analyserFloatArrayBuffer = new Float32Array(this.analyserNode.fftSize);
        return this;
    }
    // Public getters and setters
    get volume() {
        if (!this.gainNode)
            return null;
        return this.gainNode.gain.value;
    }
    get panLevel() {
        if (!this.stereoPannerNode)
            return null;
        return this.stereoPannerNode.pan.value;
    }
}
