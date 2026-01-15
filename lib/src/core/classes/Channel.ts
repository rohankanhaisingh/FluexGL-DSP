import { v4 } from "uuid";
import { Debug } from "../../utilities/debugger";
import { AudioClipPlayer } from "./AudioClipPlayer";
import { AudioClip } from "./AudioClip";
import { Master } from "./Master";
import { Effector } from "./Effector";
import { ErrorCodes } from "../../console-codes";

export class Channel {

    public id: string = v4();
    public label: string = "Channel";

    public input: AudioNode | null = null;
    public stereoPannerNode: StereoPannerNode | null = null;
    public analyserNode: AnalyserNode | null = null;
    public gainNode: GainNode | null = null;
    public output: AudioNode | null = null;

    public effects: Effector[] = [];
    public context: AudioContext | null = null;

    public sends: Channel[] = [];
    public audioClipPlayer: AudioClipPlayer | null = null;

    constructor(context: AudioContext, label?: string) {
        this.context = context;
        this.label = label ?? this.label;

        this.disconnectAudioNodes(true);

        this.input = new GainNode(context);
        this.stereoPannerNode = new StereoPannerNode(context);
        this.analyserNode = new AnalyserNode(context);
        this.gainNode = new GainNode(context);
        this.output = new GainNode(context);

        this.audioClipPlayer = new AudioClipPlayer(context);

        this.input.connect(this.stereoPannerNode);
        this.stereoPannerNode.connect(this.analyserNode);
        this.analyserNode.connect(this.gainNode);
        this.gainNode.connect(this.output);

        this.audioClipPlayer.Send(this);
    }

    private rebuildEffectChain(): void {

        if (!this.input || !this.stereoPannerNode) {
            Debug.Error("Could not rebuild effect chain because one or more required audio nodes are undefined.", [
                `Channel id: ${this.id}.`,
                `Input defined: ${!!this.input}.`,
                `StereoPannerNode defined: ${!!this.stereoPannerNode}.`
            ]);
            return;
        }

        this.input.disconnect();

        for (const effect of this.effects)
            effect.audioWorkletNode?.disconnect();

        const activeEffects = this.effects.filter(function (e: Effector): boolean {
            return !!e.audioWorkletNode;
        });

        if (activeEffects.length === 0) {
            this.input.connect(this.stereoPannerNode);
            return;
        }

        this.input.connect(activeEffects[0].audioWorkletNode as AudioNode);

        for (let i: number = 0; i < activeEffects.length - 1; i++) {
            
            const current = activeEffects[i].audioWorkletNode as AudioNode;
            const next = activeEffects[i + 1].audioWorkletNode as AudioNode;

            current.connect(next);
        }

        (activeEffects[activeEffects.length - 1].audioWorkletNode as AudioNode).connect(this.stereoPannerNode);
    }

    public AddEffect(effect: Effector): void {

        if (!this.context) {
            Debug.Error("Could not add effect because this channel has no AudioContext.");
            return;
        }

        if (this.effects.includes(effect)) {
            Debug.Error("Could not add effect because it is already part of this channel", [
                "Call .RemoveEffect([effect Effector]) before adding effect."
            ], ErrorCodes.EFFECT_ALREADY_ATTACHED);
            return;
        }

        this.effects.push(effect);
        effect.InitializeOnAttachment(this.context);
        this.rebuildEffectChain();
    }

    public AttachEffect(effect: Effector): void {
        return this.AddEffect(effect);
    }

    public RemoveEffect(effect: Effector): void {

        if (!this.effects.includes(effect)) {
            Debug.Error("Could not remove effect, because it is not part of this channel.", [
                "Call .AddEffect([effect Effector]) before removing effect."
            ], ErrorCodes.EFFECT_NOT_FOUND);
            return;
        }

        const self: Channel = this;

        this.effects.forEach(function (_effect: Effector, index: number): void {
            if (effect.id === _effect.id)
                self.effects.splice(index, 1);
        });

        effect.audioWorkletNode?.disconnect();

        this.rebuildEffectChain();
    }

    public DetachEffect(effect: Effector): void {
        return this.RemoveEffect(effect);
    }

    private disconnectAudioNodes(gc?: boolean) {

        this.input?.disconnect();
        this.stereoPannerNode?.disconnect();
        this.analyserNode?.disconnect();
        this.gainNode?.disconnect();
        this.output?.disconnect();

        for (const effect of this.effects) {
            effect.audioWorkletNode?.disconnect();
        }

        if (gc) {
            this.input = null;
            this.stereoPannerNode = null;
            this.analyserNode = null;
            this.gainNode = null;
            this.output = null;
        }
    }

    private isInitialized(): boolean {
        return !!(this.context && this.input && this.output);
    }

    private isReachable(target: Channel): boolean {

        const visited: Set<string> = new Set<string>();
        const stack: Channel[] = [this];

        while (stack.length > 0) {

            const current: Channel = stack.pop() as Channel;

            if (current.id === target.id)
                return true;

            if (visited.has(current.id))
                continue;

            visited.add(current.id);

            for (let i: number = 0; i < current.sends.length; i++)
                stack.push(current.sends[i]);
        }

        return false;
    }

    public Send(channel: Channel | Master) {

        if (channel instanceof Master)
            return (channel as Master).AttachChannel(this);

        if (channel.id === this.id) return Debug.Error("Could not link channel to itself.", [
            `This channel id: ${this.id}`
        ], ErrorCodes.CHANNEL_CANNOT_LINK_TO_ITSELF);

        if (!this.isInitialized() || !channel.isInitialized()) return Debug.Error("Could not link channels because one (or both) channels are not initialized.", [
            `This channel id: ${this.id} initialized: ${this.isInitialized()}`,
            `Target channel id: ${channel.id} initialized: ${channel.isInitialized()}`
        ], ErrorCodes.CHANNEL_NOT_INITIALIZED);

        if (this.context !== channel.context) return Debug.Error("Could not link channels because they do not share the same AudioContext.", [
            `This channel context: ${this.context ? "set" : "null"}`,
            `Target channel context: ${channel.context ? "set" : "null"}`
        ], ErrorCodes.CHANNEL_NOT_SAME_AUDIO_CONTEXT);

        if (this.sends.includes(channel)) return Debug.Error("Could not link channels, because the given channel is already linked with this one.", [
            `This channel id: ${this.id}`,
            `Target channel id: ${channel.id}`
        ], ErrorCodes.CHANNEL_ALREADY_LINKED);

        if (channel.isReachable(this)) return Debug.Error("Could not link channels because it would create a feedback loop.", [
            `This channel id: ${this.id}`,
            `Target channel id: ${channel.id}`
        ], ErrorCodes.CHANNEL_POSSIBLE_FEEDBACK_LOOP);

        (this.output as AudioNode).connect(channel.input as AudioNode);

        this.sends.push(channel);
    }

    public Unsend(channel: Channel | Master) {

        if (channel instanceof Master)
            return (channel as Master).DetachChannel(this);

        const idx: number = this.sends.indexOf(channel);

        if (idx === -1) return;

        if (this.output && channel.input)
            this.output.disconnect(channel.input);

        this.sends.splice(idx, 1);
    }

    public HasAudioClipPlayer(): boolean {
        return !!this.audioClipPlayer;
    }

    public UnsendToAllChannels() {

        for (var i: number = 0; i < this.sends.length; i++) {
            this.Unsend(this.sends[i]);
            i--;
        }
    }

    public AttachAudioClip(audioClip: AudioClip): Channel {

        if (!this.audioClipPlayer) throw Error("Cannot not link AudioClip to this channel because this channel's AudioClipPlayer is undefined.");

        this.audioClipPlayer.AttachAudioClip(audioClip);
        return this;
    }

    public Volume(volume?: number): number {

        if(!this.context) throw new Error("Could not set volume on channel, because it's context is undefined.");
        if(!this.gainNode) throw new Error("Could not set volume on channel, because it's GainNode is undefined.")

        volume && this.gainNode.gain.setValueAtTime(volume, this.context.currentTime);
        return volume ?? this.gainNode.gain.value;
    }

    public Pan(pan?: number): number {
        
        if(!this.context) throw new Error("Could not set pan on channel, because it's context is undefined.");
        if(!this.stereoPannerNode) throw new Error("Cannot set pan on channel, because it's StereoPannerNode is undefined.");

        pan && this.stereoPannerNode.pan.setValueAtTime(pan, this.context.currentTime);
        return pan ?? this.stereoPannerNode.pan.value;
    }
}
