import { minify, MinifyOptions } from "terser";

import _ChorusProcessor from "./src/ChorusProcessor.worklet";
import _DistortionProcessor from "./src/DistortionProcessor.worklet";
import _EqualizerProcessor from "./src/EqualizerProcessor.worklet";
import _FilterProcessor from "./src/FilterProcessor.worklet";
import _LimiterProcessor from "./src/LimiterProcessor.worklet";
import _SaturationProcessor from "./src/SaturationProcessor.worklet";
import _SoftClipProcessor from "./src/SoftClipProcessor.worklet";
import _StereoPannerProcessor from "./src/StereoPannerWorklet.worklet";

export namespace ProcessorWorklets {

    export let ChorusProcessor: string = "";
    export let DistortionProcessor: string = "";
    export let EqualizerProcessor: string = "";
    export let FilterProcessor: string = "";
    export let LimiterProcessor: string = "";
    export let SaturationProcessor: string = "";
    export let SoftClipProcessor: string = "";
    export let StereoPannerProcessor: string = "";

    export const minifyOptions: MinifyOptions = {
        toplevel: true,
        sourceMap: true
    }

    export async function MinifyProcessorWorkletCode() {

        ChorusProcessor = (await minify(_ChorusProcessor, minifyOptions)).code ?? "";
        DistortionProcessor = (await minify(_DistortionProcessor, minifyOptions)).code ?? "";
        EqualizerProcessor = (await minify(_EqualizerProcessor, minifyOptions)).code ?? "";
        FilterProcessor = (await minify(_FilterProcessor, minifyOptions)).code ?? "";
        LimiterProcessor = (await minify(_LimiterProcessor, minifyOptions)).code ?? "";
        SaturationProcessor = (await minify(_SaturationProcessor, minifyOptions)).code ?? "";
        SoftClipProcessor = (await minify(_SoftClipProcessor, minifyOptions)).code ?? "";
        SoftClipProcessor = (await minify(_SoftClipProcessor, minifyOptions)).code ?? "";
        StereoPannerProcessor = (await minify(_StereoPannerProcessor, minifyOptions)).code ?? "";
    }
}