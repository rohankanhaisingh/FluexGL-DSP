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

    await pipeline.initializeDpsPipeline();

    const audioDevice = await pipeline.resolveDefaultAudioOutputDevice();

    if(!audioDevice) return;

    const master = audioDevice.getMasterChannel();
    const context = audioDevice.getContext();

    const audioSource = await LoadAudioSource("/music.mp3");

    if(!audioSource) return;

    const audioClip = new AudioClip(audioSource);
    const channel = new Channel(context);

    channel.send(master);
    audioClip.send(channel);

    button.addEventListener("click", function() {
        audioClip.play();
    });
})();
```

## 🎙️ Input and output devices

Input devices (microphones, line-ins) are opened as an `InputChannel`, which works like any other channel: effects, volume, panning and sends.
Both input and output devices can be switched at runtime, without rebuilding the audio graph or reloading the page.

```ts
import { listAudioInputDevices, listAudioOutputDevices, watchAudioDevices } from "@fluex/fluexgl-dsp";

const master = audioDevice.getMasterChannel();

// Open the default input device, and monitor it through the master channel.
const microphone = await audioDevice.createInputChannel(null, "Microphone");
microphone.send(master);

// Switch devices at any time.
const inputs = await listAudioInputDevices();
const outputs = await listAudioOutputDevices();

await microphone.setInputDevice(inputs[1]);
await audioDevice.setOutputDevice(outputs[1]); // Requires AudioContext.setSinkId() support.

// Keep a device menu up to date when devices are plugged in or out.
watchAudioDevices(({ inputs, outputs }) => renderDeviceMenu(inputs, outputs));
```

When a selected device is disconnected, the audio device or input channel falls back to the default device and fires an `output-device-lost` or `input-device-lost` event.

## 🔀 Splitting and merging (stereo/mono)

The `StereoMono` effect routes the left and right channel of a signal: `stereo`, `mono`, `swap`, `left`, `right`, `left-to-both`, `right-to-both`, `mid` and `side`, with an optional delay and polarity inversion per side.

`StereoMono.split()` splits a channel into two branches that can be processed separately. Merging is done by sending both branches to the same channel. Splits are lossless: `left` + `right` and `mid` + `side` add up to the original signal.

```ts
import { StereoMono, LowPassFilter } from "@fluex/fluexgl-dsp";

const source = audioDevice.createChannel("Source");
const surround = audioDevice.createChannel("Surround");

// Pseudo surround: keep the mid as is, and turn the side signal into a diffuse "rear".
const [mid, side] = StereoMono.split(source, "mid-side");

(side.effects[0] as StereoMono).setDelayRight(18);
side.attachEffect(new LowPassFilter({ cutoff: 7000 }));
side.volume(1.4);

mid.send(surround);
side.send(surround);
surround.send(audioDevice.getMasterChannel());
```

## 💡 Effects, tools and more
FluexGL DSP provides built-in such as effects, tools, and utilities for advanced web audio processing, such as reverbs, delays, and stereo imaging effects.

The library also includes a powerful debugging system that allows developers to inspect and analyze the audio pipeline for easier troubleshooting and optimization.

## Web Assembly

FluexGL DSP is partially made using Web Assembly, and Rust as programming language. In order to use FluexGL DSP, the wasm source code must be provided when initializing the DSP pipeline. The source code can be found at the [FluexGL DSP WebAssembly Github repository](https://github.com/rohankanhaisingh/FluexGL-DSP-WebAssembly).