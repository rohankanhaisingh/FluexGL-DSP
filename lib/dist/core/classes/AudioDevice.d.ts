import { Master } from "./Master";
export declare class AudioDevice {
    deviceInfo: MediaDeviceInfo;
    id: string;
    timestamp: number;
    context: AudioContext;
    masterChannel: Master;
    masterChannels: Master[];
    constructor(deviceInfo: MediaDeviceInfo);
    GetMasterChannel(): Master;
    SetMasterChannel(channel: Master): void;
    CreateMasterChannel(): Master;
    GetContext(): AudioContext;
}
//# sourceMappingURL=AudioDevice.d.ts.map