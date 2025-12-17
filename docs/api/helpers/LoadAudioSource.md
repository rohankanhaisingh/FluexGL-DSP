# LoadAudioSource

An essential helper function within **FluexGL DSP** for loading audio files from a specified path.

```ts
export async function LoadAudioSource(path: string, options: Partial<LoadAudioSourceOptions> = { allowForeignFileTypes: false }): Promise<AudioSourceData | null>;
```

## About

The `LoadAudioSource()` function loads an audio file from a given path and decodes it into an [`AudioBuffer`](https://developer.mozilla.org/en-US/docs/Web/API/AudioBuffer) using the Web Audio API.  
It verifies the file type using MIME type detection and performs error handling when the file type or path cannot be resolved.

**Note:** This function is *asynchronous*, which means you must call it within an asynchronous scope.

## Parameters

| Name | Type | Default | Description |
|------|------|----------|-------------|
| `path` | `string` | — | The file path or URL to the audio source. |
| `options` | `Partial<LoadAudioSourceOptions>` | `{ allowForeignFileTypes: false }` | Optional configuration that controls how the function handles unknown or unsupported file types. |

### LoadAudioSourceOptions

| Property | Type | Default | Description |
|-----------|------|----------|-------------|
| `allowForeignFileTypes` | `boolean` | `false` | Whether to allow loading of files with unrecognized or unsupported file types. |

## Returns

[`AudioSourceData`](../core/AudioSourceData.md) \| `null` —  
Returns an [`AudioSourceData`](../core/AudioSourceData.md) object containing the decoded audio data and metadata, or `null` if loading failed.

## Errors and Warnings

- **ErrorCodes.NO_FILE_TYPE_FOUND** — The file type could not be determined and foreign file types are not allowed.  
- **ErrorCodes.PATH_TO_FILE_NOT_FOUND** — The specified file could not be found or loaded.  
- **Warning** — If the file type is not recognized but `allowForeignFileTypes` is `true`, a warning will be printed:  
  `"The file type of the specified file is unknown and possibly unsupported, but will be used anyways."`

## Usage

```ts
import { LoadAudioSource, InitializeDspPipeline, AudioSourceData } from "@fluexgl/dsp";

async function main() {
    const hasInitialized: boolean = await InitializeDspPipeline();
    if (!hasInitialized) return;

    const audioSource: AudioSourceData | null = await LoadAudioSource("/assets/audio/track.wav", {
        allowForeignFileTypes: true
    });

    if (!audioSource) {
        console.error("Failed to load the audio source.");
        return;
    }

    console.log("Audio source loaded:", audioSource);
}

window.addEventListener("load", main);
```