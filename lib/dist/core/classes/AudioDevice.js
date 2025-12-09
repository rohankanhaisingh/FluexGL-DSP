import { v4 } from "uuid";
import { Master } from "./Master";
import { ErrorCodes } from "../../console-codes";
import { Debug } from "../../utilities/debugger";
export class AudioDevice {
    deviceInfo;
    id = v4();
    timestamp = Date.now();
    masterChannel = new Master();
    masterChannels = [];
    constructor(deviceInfo) {
        this.deviceInfo = deviceInfo;
    }
    GetMasterChannel() {
        return this.masterChannel;
    }
    SetMasterChannel(channel) {
        if (channel.id === this.masterChannel.id)
            return Debug.Error("The provided master channel is the same as the current channel.", [
                "Provide this method with a different master channel.",
                `Received master channel ID ${channel.id}.`
            ], ErrorCodes.SAME_MASTER_CHANNEL);
        this.masterChannel = channel;
    }
    CreateMasterChannel() {
        const master = new Master();
        this.masterChannels.push(master);
        return master;
    }
}
