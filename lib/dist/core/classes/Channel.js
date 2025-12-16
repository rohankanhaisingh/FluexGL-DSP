import { v4 } from "uuid";
import { Debug } from "../../utilities/debugger";
export class Channel {
    id = v4();
    label = "Channel";
    linkedChannels = [];
    input = null;
    stereoPannerNode = null;
    analyserNode = null;
    gainNode = null;
    output = null;
    context = null;
    master = null;
    constructor(master) {
        if (!master)
            return;
        this.master = master;
        this.context = master.context;
    }
    Initialize(source) {
        if (!source.context) {
            return Debug.Error("Could not initialize channel, because the source's AudioContext is undefined.", ["Tried initializing from source (Master or a linked channel): " + source.id]);
        }
        this.context = source.context;
        this.disconnectAudioNodes(true);
        // Basis nodes
        var ctx = this.context;
        this.input = ctx.createGain(); // handig als “ingang”
        this.stereoPannerNode = ctx.createStereoPanner();
        this.analyserNode = ctx.createAnalyser();
        this.gainNode = ctx.createGain();
        this.output = ctx.createGain(); // handig als “uitgang”
        // Connect chain: input -> panner -> analyser -> gain -> output
        this.input.connect(this.stereoPannerNode);
        this.stereoPannerNode.connect(this.analyserNode);
        this.analyserNode.connect(this.gainNode);
        this.gainNode.connect(this.output);
    }
    disconnectAudioNodes(gc) {
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
    isInitialized() {
        return !!(this.context && this.input && this.output);
    }
    isReachable(target) {
        const visited = new Set();
        const stack = [this];
        while (stack.length > 0) {
            const current = stack.pop();
            if (current.id === target.id)
                return true;
            if (visited.has(current.id))
                continue;
            visited.add(current.id);
            for (let i = 0; i < current.linkedChannels.length; i++)
                stack.push(current.linkedChannels[i]);
        }
        return false;
    }
    Link(channel) {
        if (channel.id === this.id)
            return Debug.Error("Could not link channel to itself.", [
                `This channel id: ${this.id}`
            ]);
        if (!this.isInitialized() || !channel.isInitialized())
            return Debug.Error("Could not link channels because one (or both) channels are not initialized.", [
                `This channel id: ${this.id} initialized: ${this.isInitialized()}`,
                `Target channel id: ${channel.id} initialized: ${channel.isInitialized()}`
            ]);
        if (this.context !== channel.context)
            return Debug.Error("Could not link channels because they do not share the same AudioContext.", [
                `This channel context: ${this.context ? "set" : "null"}`,
                `Target channel context: ${channel.context ? "set" : "null"}`
            ]);
        if (this.linkedChannels.includes(channel))
            return Debug.Error("Could not link channels, because the given channel is already linked with this one.", [
                `This channel id: ${this.id}`,
                `Target channel id: ${channel.id}`
            ]);
        if (channel.isReachable(this))
            return Debug.Error("Could not link channels because it would create a feedback loop.", [
                `This channel id: ${this.id}`,
                `Target channel id: ${channel.id}`
            ]);
        this.output.connect(channel.input);
        this.linkedChannels.push(channel);
    }
    Unlink(channel) {
        const idx = this.linkedChannels.indexOf(channel);
        if (idx === -1)
            return;
        if (this.output && channel.input)
            this.output.disconnect(channel.input);
        this.linkedChannels.splice(idx, 1);
    }
    UnlinkFromAllChannels() {
        for (var i = 0; i < this.linkedChannels.length; i++) {
            this.Unlink(this.linkedChannels[i]);
            i--;
        }
    }
}
