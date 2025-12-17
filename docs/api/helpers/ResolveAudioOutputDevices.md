# ResolveAudioOutputDevices

An important helper function within FluexGL DSP. 

```ts
async function ResolveAudioOutputDevices(): Promise<AudioDevice[]>;
```

## About

The ``ResolveAudioOutputDevices()`` function asynchronously enumerates all available audio devices, filters those of the kind 'audiooutput', and returns an array of [``AudioDevice``](../core/AudioDevice.md).

**Note: This function is asynchronous, which means you must call it within an asynchronous scope.**

## Parameters
This function requires no arguments.

## Returns [``AudioDevice[]``](../core/AudioDevice.md).
This function returns an array of [``AudioDevice``](../core/AudioDevice.md) instances.

## Usage
```ts

import { InitializeDspPipeline, ResolveAudioOutputDevices, AudioDevice } from "@fluexgl/dsp";

async function main() {

    const hasInitialized: boolean = await InitializeDspPipeline();

    if(!hasInitialized) return;

    const audioOutputDevices: AudioDevice[] = await ResolveAudioOutputDevices();

}
window.addEventListener("load", main);
```