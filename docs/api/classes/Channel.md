# Class ``Channel``

A virtual channel.

## Example
```ts
import { Channel } from "@fluexgl/dsp";

...

const channel = new Channel();
channel.SetLabel("Background Music");

master.AddChannel(channel);
```

- - -

## Constructor

Constructs a new channel.
```ts
new Channel(options?: ChannelOptions): Channel;
```
### Arguments
- ``options``: [``ChannelOptions``](../interfaces/ChannelOptions)  - A constructed [``ChannelOptions``](../interfaces/ChannelOptions) typed object.

## Properties

### ``id: string``
An unique id, automatically generated when constructing a new channel. Should NOT be changed.
```ts
class Channel {
    public id: string;
}
```

### ``effects: Effector[]``
An array with applied effects. See [``Effector``](./Effector.md) for more details.
```ts
class Channel {
    public effects: Effector[];
}
```

### ``label: string``
Custom channel label. Useful for debugging.
```ts
class Channel {
    public label: string;
}
```

### ``parentialContext: AudioContext | null``
The parential context, usually inherited from the master channel.
```ts
class Channel {
    public parentialContext: AudioContext | null;
}
```

### ``parentialMasterChannel: Master | null``
The parential channel, usually a master channel. See [``Master``](./Master.md) for more details.
```ts
class Channel {
    public parentialMasterChannel: Master | null;
}
```

### ``audioClips: AudioClip[]``
An array with audio clips. See [``AudioClip``](./AudioClip.md) for more details.
```ts
class Channel {
    public audioClips: AudioClip[];
}
```

### ``gainNode: GainNode | null``
Main channel gain node. Can be tweaked.
```ts
class Channel {
    public gainNode: GainNode | null;
}
```

### ``stereoPannerNode: StereoPannerNode | null``
Main stereo panner node. Can be tweaked.
```ts
class Channel {
    public stereoPannerNode: StereoPannerNode | null;
}
```

### ``analyserNode: AnalyserNode | null``
Analyser node, cannot be tweaked.

```ts
class Channel {
    public analyserNode: AnalyserNode | null;
}
```

### ``audioClipsInputGainNode: GainNode | null``
Gain node specifically made as output gain node for audio clips. Should left behind and not be interacted with.
```ts
class Channel {
    audioClipsInputGainNode: GainNode | null;
}
```

### ``volume: number | null``
Volume of the channel, gets the value from the gain node. Will return ``null`` if the gain node is undefined.
```ts
class Channel {
    public get volume(): number | null;
}
```

### ``panLevel: number | null``
Pan level of the channel, gets the value from the stereo panner node. Will return ``null`` if the stereo panner node is undefined.
```ts
class Chanel {
    public get panLevel(): number | null;
}
```

## Methods

### ``SetLabel(label: string): void``
Sets the name of the channel, as suggested from the name of this method.

- ``label: string``: The new channel label

### ``ClearLabel(): void``
Clears the label, as suggested from the name of this method.

### ``AttachAudioClip(clip: AudioClip): void``
Attaches a new audio clip to this channel. Cannot be attached twice, should be deattached in order to attach again.

- ``clip: AudioClip``: An [``AudioClip``](./AudioClip.md) class instance.

### ``DetachAudioClip(clip: AudioClip): void``
Detaches the provided audio clip using it's id. Cannot be deattached if the clip has not been attached to this channel.

- ``clip: AudioClip``: An [``AudioClip``](./AudioClip.md) class instance.

### ``SetVolume(volume: number): void``
Sets the volume of this channel, using it's GainNode.

- ``volume: number``: The volume in either integers or floating numbers.

### ``SetPanLevel(pan: number): void``
Sets the pan level of this channel, using it's StereoPannerNode

- ``pan: number``: The pan level in either integers or floating numbers. **Note: the value has to be between -1 and 1. With -1 representing very left, and 1 very right.**

### ``AddEffect(effect: Effector): void``
Adds an effect to this channel. Cannot add the same effect on this channel. Should be removed before adding again.

- ``effect: Effector``: An [``Effector``](./Effector.md) extended class instance.

### ``RemoveEffect(effect: Effector): void``
Removes an effect from this channel. Cannot remove if the effect does not exist on this channel.

- ``effect: Effector``: An [``Effector``](./Effector.md) extended class instance.

### ``SetAnalyserFftSize(value: number): number | null``
Sets the FFT size on the analyser. De default value is 32 to improve performance. Be aware that the higher the value, the more processing power it costs the analyse the frequencies.

- ``value: number``: Unsigned long representing the window size in samples. See [https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/fftSize](https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/fftSize) for more details.

### ``GetWaveformFloatData(): Float32Array | null``
Uses the analyser to analyse the frequencies and put it into the channel's Float32Array. Will return ``null`` if the analyser is undefined.

Useful for monitoring the output of the channel, with the audio clips and effects merged.

### ``GetWaveformByteData(): Uint8Array | null``
Uses the analyser to analyse the frequencies and put it into the channel's Uint8Array. Will return ``null`` if the analyser is undefined.

Useful for monitoring the output of the channel, with the audio clips and effects merged.