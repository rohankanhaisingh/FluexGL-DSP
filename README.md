# 🎚️ FluexGL DSP
An open-source, web-based DSP library developed alongside FluexGL, with the purpose of creating and manipulating sound in various contexts.

This open-source project is part of the Fluex ecosystem and is maintained by Rohan Kanhaisingh, the lead developer of this library.

**Note: this project is still under development and may not work yet.**

## 🧩 About
FluexGL DSP is a modern, TypeScript-based Web Audio library for creating and manipulating sound. Inspired by and based on DAW-style workflows, it provides a flexible, object-oriented channel system with master and sub channels.

It integrates smoothly with FluexGL, making it ideal for use in games, interactive web experiences, and multimedia projects.

## 📦 Installation

See down below for more details.

```
$ npm i @fluex/fluexgl-dsp
```

## ⚡ Quick start

```ts
import { DspPipeline, Channel, LoadAudioSource, AudioClip } from "@fluex/fluexgl-dsp";

(async function() {

    const pipeline = new DspPipeline({
        pathToWasm: "/data/fluexgl-dsp-wasm_bg.wasm",
        pathToWorklet: "/data/fluexgl-dsp-processor.worklet"
    });

    await pipeline.InitializeDpsPipeline();

    const audioDevice = await pipeline.ResolveDefaultAudioOutputDevice();

    if(!audioDevice) return;

    const master = audioDevice.GetMasterChannel();
    const context = audioDevice.GetContext();

    const audioSource = await LoadAudioSource("/music.mp3");

    if(!audioSource) return;

    const audioClip = new AudioClip(audioSource);
    const channel = new Channel(context);

    channel.Send(master);
    audioClip.Send(channel);

    button.addEventListener("click", function() {
        audioClip.Play();
    });
})();
```

## 💡 Effects, tools and more
FluexGL DSP provides built-in such as effects, tools, and utilities for advanced web audio processing, such as reverbs, delays, and stereo imaging effects.

The library also includes a powerful debugging system that allows developers to inspect and analyze the audio pipeline for easier troubleshooting and optimization.

## Web Assembly

FluexGL DSP is partially made using Web Assembly, and Rust as programming language. In order to use FluexGL DSP, the wasm source code must be provided when initializing the DSP pipeline. The source code can be found at the [FluexGL DSP WebAssembly Github repository](https://github.com/rohankanhaisingh/FluexGL-DSP-WebAssembly).