import { v4 } from "uuid";

import { Effector } from "./Effector";
import { AudioClip } from "./AudioClip";
import { AudioClipPlayer } from "./AudioClipPlayer";
import { Master } from "./Master";

import { ChannelOptions } from "../../typings";
import { Debug } from "../../utilities/debugger";

export class Channel {

    public id: string = v4();
    public label: string = "Channel";

    public linkedChannels: Channel[] = [];
    public effects: Effector[] = [];

    declare public audioClipPlayer: AudioClipPlayer;

    declare public input: AudioNode | null;
    declare public stereoPannerNode: StereoPannerNode | null;
    declare public analyserNode: AnalyserNode | null;
    declare public gainNode: GainNode | null;
    declare public output: AudioNode | null;

    declare public context: AudioContext | null;
    declare public master: Master | null;

    constructor(master?: Master) {

        if (!master) return;

        this.master = master;
        this.context = master.context;
    }

    private initializeChannelFromMaster(master: Master) {

    }

    private initializeChannelFromChannel(channel: Channel) {

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

    public Initialize(source: Master | Channel) {

        if (!source.context) return Debug.Error("Could not initialize channel, because the source's AudioContext is undefined.", [
            "Tried initializing from source (Master or a linked channel): " + source.id,
        ]);

        this.disconnectAudioNodes();
    }

    public Link(channel: Channel) {

        if (this.linkedChannels.includes(channel)) return Debug.Error("Could not link channels, because the given channel is already linked with this one.", [
            `This channel id: ${this.id}`,
            `Target channel id: ${this.id}`
        ]);

        
    }

    public Unlink(channel: Channel) {

    }

    public UnlinkFromAllChannels() {

    }
}