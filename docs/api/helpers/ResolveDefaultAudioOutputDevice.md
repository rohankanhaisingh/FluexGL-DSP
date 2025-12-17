# ResolveDefaultAudioOutputDevice

An important helper function within **FluexGL DSP**.

```ts
export async function ResolveDefaultAudioOutputDevice(): Promise<AudioDevice | null>;
```

## About

The `ResolveDefaultAudioOutputDevice()` function attempts to retrieve the system's default audio output device.  
If no default audio device is found, it will print a warning to the console with the warning code  
`FLUEXGL@AUDIO_WARNING_0001` from the enum `WarningCodes.NO_DEFAULT_AUDIO_DEVICE_FOUND`.

**Note:** This function is *asynchronous*, which means you must call it within an asynchronous scope.

## Parameters

This function takes no arguments.

## Returns

[`AudioDevice`](../core/AudioDevice.md) | `null` —  
Returns an [`AudioDevice`](../core/AudioDevice.md) instance representing the default audio output device,  
or `null` if no default device was found.

## Usage

```ts
import { InitializeDspPipeline, ResolveDefaultAudioOutputDevice, AudioDevice, WarningCodes } from "@fluexgl/dsp";

async function main() {
    const hasInitialized: boolean = await InitializeDspPipeline();

    if (!hasInitialized) return;

    const defaultDevice: AudioDevice | null = await ResolveDefaultAudioOutputDevice();

    if (!defaultDevice) {
        console.warn(WarningCodes.NO_DEFAULT_AUDIO_DEVICE_FOUND);
    }
}

window.addEventListener("load", main);
```