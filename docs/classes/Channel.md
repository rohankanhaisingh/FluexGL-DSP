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

### id: ``string``
An unique id, automatically generated when constructing a new channel. Should NOT be changed.

### effects: [``Effector[]``](./Effector.md)
An array with applied effects.

### label: ``string``
Custom channel label. Useful for debugging.

### parentialContext: ``AudioContext`` | ``null``
The parential context, usually inherited from the master channel.

### parentialMasterChannel: [``Master``](./Master.md) | ``null``
The parential channel, usually a master channel.

### audioClips: [``AudioClip[]``](./AudioClip.md)
An array with audio clips.

### gainNode: ``GainNode`` | ``null``
Main channel gain node. Can be tweaked.

### stereoPannerNode: ``StereoPannerNode`` | ``null``
Main stereo panner node. Can be tweaked.

### audioClipsInputGainNode: ``GainNode`` | ``null``
Gain node specifically made as output gain node for audio clips. Should left behind and not be interacted with.

### volume: ``number`` | ``null``
Volume of the channel, gets the value from the gain node. Will return ``null`` if the gain node is undefined.

### panLevel: ``number`` | ``null``
Pan level of the channel, gets the value from the stereo panner node. Will return ``null`` if the stereo panner node is undefined.

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