# ResolveAudioInputDevices

An important helper function within **FluexGL DSP**.

```ts
export async function ResolveAudioInputDevices(): Promise<AudioDevice[]>;
```

## About

The `ResolveAudioInputDevices()` function asynchronously enumerates all available audio devices, filters those of the kind `'audioinput'`, and returns an array of [`AudioDevice`](../core/AudioDevice.md) instances.

**Note:** This function is *asynchronous*, which means you must call it within an asynchronous scope.

## Parameters

This function takes no arguments.

## Returns

[`AudioDevice[]`](../core/AudioDevice.md) —  
An array of [`AudioDevice`](../core/AudioDevice.md) instances.

## Usage

```ts
import { InitializeDspPipeline, ResolveAudioInputDevices, AudioDevice } from "@fluexgl/dsp";

async function main() {
    const hasInitialized: boolean = await InitializeDspPipeline();

    if (!hasInitialized) return;

    const audioInputDevices: AudioDevice[] = await ResolveAudioInputDevices();
}

window.addEventListener("load", main);
```