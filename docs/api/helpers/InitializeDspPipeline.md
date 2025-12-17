# InitializeDspPipeline

An important helper function within FluexGL DSP. 

```ts
async function InitializeDspPipeline(options: DspPipelineInitializationOptions): Promise<boolean>;
```

## About

The ``InitializeDspPipeline()`` function is the most important function of the entire library. This functions ensures that audio devices can be used, and loads web assembly modules under the hood. Without initializing the dsp pipeline, FluexGL DSP cannot process audio and perform heavy tasks.

This function will throw an error if the user has not granted permission to FluexGL DSP to access media devices, or if the WASM modules could not be initialized. The error code would be either ``FLUEXGL@AUDIO_ERROR_0001`` or ``FLUEXGL@AUDIO_ERROR_0005``.

**Note! This function is asynchroneous, which means you have to call it within a asynchroneous scope.**

## Parameters
- ``options``: [``DspPipelineInitializationOptions``](../interfaces/DspPipelineInitializationOptions.md)

## Returns ``boolean``
This function returns a boolean wrapped in a Promise object, representing the state of the initialization. 

## Usage
```ts

import { InitializeDspPipeline } from "@fluexgl/dsp";

async function main() {

    const hasInitialized: boolean = await InitializeDspPipeline({
        pathToWasm: "/assets/_dist/fluex_dsp_bg.wasm"
    });

    if(!hasInitialized) return console.log("Aawh man, could not initialize the DSP pipeline".);

    // The rest of the code will be written after initializing the DSP pipeline.
}

window.addEventListener("load", main);