import { DspPipeline, Channel } from "../index";

(async function() {

    const pipeline = new DspPipeline({
        pathToWasm: "",
        pathToWorklet: ""
    });

    const hasInitialized = await pipeline.Init();

    if(!hasInitialized) return;

    const audioDevice = await pipeline.ResolveDefaultAudioOutputDevice();
    
    if(!audioDevice) return;

    const master = audioDevice.GetMasterChannel();

    const channel1 = new Channel();
    const channel2 = new Channel();
})();