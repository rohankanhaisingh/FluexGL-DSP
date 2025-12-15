import { v4 } from "uuid";

import { Channel } from "./Channel";

import { Debug } from "../../utilities/debugger";
import { AudioClipPlayer } from "./AudioClipPlayer";

export class Master {

    public id: string = v4();
    public channels: Channel[] = [];
    public context: AudioContext = new AudioContext();

    public gainNode: GainNode = this.context.createGain();
    public analyserNode: AnalyserNode = this.context.createAnalyser();

    constructor() {
     
        this.gainNode.connect(this.analyserNode);
        this.analyserNode.connect(this.context.destination);
    }

    public AttachChannel(channel: Channel): void {

        if(this.channels.includes(channel)) return Debug.Error("Could not attach the channel because it is already part of this master channel.",[
            "Call .DetachChannel([channel Channel]) before attaching the channel."
        ]);

        channel.Initialize(this);

        this.channels.push(channel);
        return;
    }

    public DetachChannel(channel: Channel): void {

        if(!this.channels.includes(channel)) return Debug.Error("Could not detach the channel because it is not part of this master channel.", [
            "Call .AttachChannel([channel Channel]) before detaching the channel."
        ]);

        const self = this;

        this.channels.forEach(function(_channel: Channel, index: number) {
            if(channel.id === _channel.id) {

                self.channels.splice(index, 1);
                return;
            }
        });
    }
}