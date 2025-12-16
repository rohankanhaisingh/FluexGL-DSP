import { v4 } from "uuid";
import { Debug } from "../../utilities/debugger";
import { Master } from "./Master";

export class Channel {
    public id: string = v4();
    public label: string = "Channel";

    public linkedChannels: Channel[] = [];

    public input: AudioNode | null = null;
    public stereoPannerNode: StereoPannerNode | null = null;
    public analyserNode: AnalyserNode | null = null;
    public gainNode: GainNode | null = null;
    public output: AudioNode | null = null;

    public context: AudioContext | null = null;
    public master: Master | null = null;

    constructor(master?: Master) {
        
        if (!master) return;

        this.master = master;
        this.context = master.context;
    }

    public Initialize(source: Master | Channel) {

        if (!source.context) return Debug.Error("Could not initialize channel, because the source's AudioContext is undefined.", [
            "Tried initializing from source (Master or a linked channel): " + source.id
        ]);

        this.context = source.context;
        this.disconnectAudioNodes(true);

        const ctx: AudioContext = this.context;

        this.input = ctx.createGain();
        this.stereoPannerNode = ctx.createStereoPanner();
        this.analyserNode = ctx.createAnalyser();
        this.gainNode = ctx.createGain();
        this.output = ctx.createGain();

        this.input.connect(this.stereoPannerNode);
        this.stereoPannerNode.connect(this.analyserNode);
        this.analyserNode.connect(this.gainNode);
        this.gainNode.connect(this.output);
    }

    private disconnectAudioNodes(gc?: boolean) {

        this.input?.disconnect();
        this.stereoPannerNode?.disconnect();
        this.analyserNode?.disconnect();
        this.gainNode?.disconnect();
        this.output?.disconnect();

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

            for (let i: number = 0; i < current.linkedChannels.length; i++)
                stack.push(current.linkedChannels[i]);
        }

        return false;
    }

    public Link(channel: Channel) {

        if (channel.id === this.id) return Debug.Error("Could not link channel to itself.", [
            `This channel id: ${this.id}`
        ]);

        if (!this.isInitialized() || !channel.isInitialized()) return Debug.Error("Could not link channels because one (or both) channels are not initialized.", [
            `This channel id: ${this.id} initialized: ${this.isInitialized()}`,
            `Target channel id: ${channel.id} initialized: ${channel.isInitialized()}`
        ]);

        if (this.context !== channel.context) return Debug.Error("Could not link channels because they do not share the same AudioContext.", [
            `This channel context: ${this.context ? "set" : "null"}`,
            `Target channel context: ${channel.context ? "set" : "null"}`
        ]);

        if (this.linkedChannels.includes(channel)) return Debug.Error("Could not link channels, because the given channel is already linked with this one.", [
            `This channel id: ${this.id}`,
            `Target channel id: ${channel.id}`
        ]);

        if (channel.isReachable(this)) return Debug.Error("Could not link channels because it would create a feedback loop.", [
            `This channel id: ${this.id}`,
            `Target channel id: ${channel.id}`
        ]);

        (this.output as AudioNode).connect(channel.input as AudioNode);

        this.linkedChannels.push(channel);
    }

    public Unlink(channel: Channel) {

        const idx: number = this.linkedChannels.indexOf(channel);

        if (idx === -1) return;

        if (this.output && channel.input)
            this.output.disconnect(channel.input);

        this.linkedChannels.splice(idx, 1);
    }

    public UnlinkFromAllChannels() {

        for (var i: number = 0; i < this.linkedChannels.length; i++) {

            this.Unlink(this.linkedChannels[i]);

            i--;
        }
    }
}
