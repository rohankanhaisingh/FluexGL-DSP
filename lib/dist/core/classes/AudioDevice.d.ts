import { Master } from "./Master";
export declare class AudioDevice {
    deviceInfo: MediaDeviceInfo;
    id: string;
    timestamp: number;
    masterChannel: Master;
    masterChannels: Master[];
    constructor(deviceInfo: MediaDeviceInfo);
    GetMasterChannel(): Master;
    SetMasterChannel(channel: Master): void;
    CreateMasterChannel(): Master;
}
//# sourceMappingURL=AudioDevice.d.ts.map