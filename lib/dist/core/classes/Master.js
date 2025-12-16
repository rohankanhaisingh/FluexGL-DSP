import { v4 } from "uuid";
import { Debug } from "../../utilities/debugger";
export class Master {
    id = v4();
    channels = [];
    context = new AudioContext();
    gainNode = this.context.createGain();
    analyserNode = this.context.createAnalyser();
    constructor() {
        this.gainNode.connect(this.analyserNode);
        this.analyserNode.connect(this.context.destination);
    }
    AttachChannel(channel) {
        if (this.channels.includes(channel))
            return Debug.Error("Could not attach the channel because it is already part of this master channel.", [
                "Call .DetachChannel([channel Channel]) before attaching the channel."
            ]);
        channel.Initialize(this);
        this.channels.push(channel);
        return;
    }
    DetachChannel(channel) {
        if (!this.channels.includes(channel))
            return Debug.Error("Could not detach the channel because it is not part of this master channel.", [
                "Call .AttachChannel([channel Channel]) before detaching the channel."
            ]);
        const self = this;
        this.channels.forEach(function (_channel, index) {
            if (channel.id === _channel.id) {
                self.channels.splice(index, 1);
                return;
            }
        });
    }
}
