# Class `AudioClip`

A single decoded audio clip that can be attached to a [`Channel`](./Channel.md), played, looped, analysed and controlled over time.

## Example

```ts
import { Channel, AudioClip } from "@fluexgl/dsp";

// Create clip
const clip = new AudioClip(data);

// Create channel and attach clip
const channel = new Channel();
channel.SetLabel("Background Music");
channel.AttachAudioClip(clip);

// Basic settings
clip.SetVolume(0.8);
clip.SetPanLevel(-0.2);
clip.Loop(true);

// Start playback
clip.Play();

// Manually seek to 30 seconds
clip.Seek(30);

```

- - -

## Constructor

Constructs a new audio clip from pre-decoded source data.

```ts
new AudioClip(data: AudioSourceData): AudioClip;
```

### Arguments

- `data: AudioSourceData` – A constructed `AudioSourceData` typed object containing at least:
  - `audioBuffer: AudioBuffer` – The decoded Web Audio buffer.
  - `arrayBuffer: ArrayBuffer` – The original binary data of the audio file.
  - (And any other metadata your pipeline provides.)

---

## Properties

### `id: string`

A unique id, automatically generated when constructing a new audio clip. Should **not** be changed.

```ts
class AudioClip {
    public id: string;
}
```

### `hasAttachedToChannel: boolean`

Indicates whether this clip has been attached to a [`Channel`](./Channel.md).

```ts
class AudioClip {
    public hasAttachedToChannel: boolean;
}
```

### `loop: boolean`

Whether the clip is set to loop when played. Managed by [`Loop`](#looploop-boolean-audioclip).

```ts
class AudioClip {
    public loop: boolean;
}
```

### `isPlaying: boolean`

Indicates whether this clip is currently playing.

```ts
class AudioClip {
    public isPlaying: boolean;
}
```

### `startTime: number`

The `AudioContext.currentTime` at which the current playback started.  
Used internally to calculate [`currentPlaybackTime`](#get-currentplaybacktime-number).

```ts
class AudioClip {
    public startTime: number;
}
```

### `offsetAtStart: number`

The offset (in seconds) inside the buffer from which playback started.

```ts
class AudioClip {
    public offsetAtStart: number;
}
```

### `gainNode: GainNode | null`

Per-clip gain node used to control volume.

```ts
class AudioClip {
    public gainNode: GainNode | null;
}
```

### `stereoPannerNode: StereoPannerNode | null`

Per-clip stereo panner node used to control pan level.

```ts
class AudioClip {
    public stereoPannerNode: StereoPannerNode | null;
}
```

### `parentialAudioContext: AudioContext | null`

The parential audio context, usually inherited from the channel’s master context.

```ts
class AudioClip {
    public parentialAudioContext: AudioContext | null;
}
```

### `parentialChannel: Channel | null`

The channel this clip is attached to. See [`Channel`](./Channel.md) for more details.

```ts
class AudioClip {
    public parentialChannel: Channel | null;
}
```

### `preAnalyser: AnalyserNode | null`

Analyser node inserted **before** the gain/pan chain when enabled. See
[`EnablePreAnalyser`](#enablepreanalyser-boolean) and waveform helpers.

```ts
class AudioClip {
    public preAnalyser: AnalyserNode | null;
}
```

### `postAnalyser: AnalyserNode | null`

Analyser node inserted **after** the gain/pan chain when enabled.

```ts
class AudioClip {
    public postAnalyser: AnalyserNode | null;
}
```

### `preAnalyserEnabled: boolean`

Whether the pre-analyser is currently enabled and connected.

```ts
class AudioClip {
    public preAnalyserEnabled: boolean;
}
```

### `postAnalyserEnabled: boolean`

Whether the post-analyser is currently enabled and connected.

```ts
class AudioClip {
    public postAnalyserEnabled: boolean;
}
```

### `preAnalyserOptions: AnalyserOptions`

Options used when creating/configuring the pre-analyser.

```ts
class AudioClip {
    public preAnalyserOptions: AnalyserOptions;
}
```

### `postAnalyserOptions: AnalyserOptions`

Options used when creating/configuring the post-analyser.

```ts
class AudioClip {
    public postAnalyserOptions: AnalyserOptions;
}
```

### `preAnalyserFloatArrayBuffer: Float32Array`

Internal float buffer used by [`GetWaveformFloatData`](#getwaveformfloatdataanalysertype-audioclipanalysertype-float32array--null)
for the pre-analyser. Typically you should not replace this buffer.

```ts
class AudioClip {
    public preAnalyserFloatArrayBuffer: Float32Array;
}
```

### `postAnalyserFloatArrayBuffer: Float32Array`

Internal float buffer used for post-analyser waveform data.

```ts
class AudioClip {
    public postAnalyserFloatArrayBuffer: Float32Array;
}
```

### `preAnalyserByteArrayBuffer: Uint8Array`

Internal byte buffer used by [`GetWaveformByteData`](#getwaveformbytedataanalysertype-audioclipanalysertype-uint8array--null)
for the pre-analyser.

```ts
class AudioClip {
    public preAnalyserByteArrayBuffer: Uint8Array;
}
```

### `postAnalyserByteArrayBuffer: Uint8Array`

Internal byte buffer used for post-analyser byte waveform data.

```ts
class AudioClip {
    public postAnalyserByteArrayBuffer: Uint8Array;
}
```

---

## Methods

### `InitializeAudioClipOnAttaching(channel: Channel): AudioClip | null`

Initializes the internal node chain for this clip using the provided channel.

This method is called from [`Channel.AttachAudioClip`](./Channel.md#attachaudioclipclip-audioclip-void) and should **not**
be called manually in normal usage.

- `channel: Channel` – The channel this clip is being attached to.

Returns:

- `AudioClip` – The same instance, when initialization succeeded.
- `null` – When the channel is not correctly attached to a master and no `AudioContext` or destination gain node is available.

---

### `Play(timestamp?: number, offset?: number): AudioClip | null`

Starts playback of the clip.

- `timestamp?: number` – Absolute `AudioContext.currentTime` at which to start.  
  If omitted, playback starts immediately.
- `offset?: number` – Offset in seconds inside the buffer to start from.  
  If omitted, uses the current `offsetAtStart`.

Behavior:

- Requires the clip to be attached to a channel (see [`Channel.AttachAudioClip`](./Channel.md)).
- Creates a new `AudioBufferSourceNode` and wires it into the current node chain.
- Respects an internal max number of `AudioBufferSourceNode` instances and returns `null` when the limit is exceeded.
- Sets `startTime`, `offsetAtStart` and `isPlaying = true`.
- Starts an internal interval that emits `"progress"` events roughly every 20ms.

Returns:

- `AudioClip` – On success.
- `null` – When the clip is not attached or cannot be played.

---

### `Seek(seconds: number): AudioClip | null`

Manually sets the playback position of this clip in seconds.

- `seconds: number` – The desired position in seconds.  
  The value is clamped between `0` and [`duration`](#get-duration-number).

Behavior:

- If the clip is **not playing**, it only updates `offsetAtStart`. The next `Play()` will start from this new position.
- If the clip **is playing**, it internally calls `Stop()` and then `Play()` from the new offset.

Returns:

- `AudioClip` – When seeking succeeded.
- `null` – When the clip is not attached to a channel or has no audio context.

---

### `Stop(): AudioClip | null`

Stops playback of this clip and disconnects all active buffer sources.

Behavior:

- Requires the clip to be attached to a channel.
- Calls `.stop()` and `.disconnect()` on each active `AudioBufferSourceNode`.
- Clears the internal list of buffer sources.
- Sets `isPlaying = false`.
- Clears the `"progress"` interval, if active.

Returns:

- `AudioClip` – On success.
- `null` – When the clip is not attached or has no audio context.

---

### `SetVolume(volume: number): AudioClip | void`

Sets the clip volume using its `GainNode`.

- `volume: number` – The desired gain value (linear).

Behavior:

- Uses `gainNode.gain.setValueAtTime(volume, audioContext.currentTime)`.
- Logs an error when the gain node or context is missing.

Returns:

- `AudioClip` – On success, for chaining.
- `void` – If the gain node or audio context is not available.

---

### `SetPanLevel(panLevel: number): AudioClip | void`

Sets the stereo pan level of the clip.

- `panLevel: number` – Pan value between **-1** (full left) and **1** (full right).

Behavior:

- If `panLevel` is outside `[-1, 1]`, an error is logged and nothing is changed.
- Uses `stereoPannerNode.pan.setValueAtTime(panLevel, audioContext.currentTime)`.

Returns:

- `AudioClip` – On success, for chaining.
- `void` – If the panner node or audio context is missing, or the value is out of range.

---

### `Loop(loop?: boolean): AudioClip`

Enables or disables looping of this clip.

- `loop?: boolean` – When omitted, defaults to `true`.

Behavior:

- Updates `AudioBufferSourceNode.loop` on all active sources.
- Updates the public [`loop`](#loop-boolean) property.

Returns:

- `AudioClip` – The same instance, for chaining.

---

### `DisconnectAllAudioBufferSourceNodes(): boolean`

Stops and disconnects all active buffer source nodes for this clip immediately.

Behavior:

- Uses the current `AudioContext.currentTime` to stop nodes.
- Calls `.stop()` and `.disconnect()` for each node in the internal list.
- Clears the internal list of buffer sources.

Returns:

- `true` – On success.
- `false` – When the audio context is missing.

---

### `AddEventListener<K extends keyof AudioClipEventMap>(event: K, cb: AudioClipEventMap[K]): () => void`

Registers a listener for clip events.

- `event: K` – Event name (e.g. `"progress"`).
- `cb: AudioClipEventMap[K]` – Callback function for that event.

Returns:

- `() => void` – A function that can be called to remove this specific listener.

---

### `Once<K extends keyof AudioClipEventMap>(event: K, cb: AudioClipEventMap[K]): () => void`

Registers a one-time event listener that automatically removes itself after the first call.

- `event: K` – Event name.
- `cb: AudioClipEventMap[K]` – Callback function.

Returns:

- `() => void` – A function that can be called to cancel the listener before it fires.

---

### `RemoveEventListener<K extends keyof AudioClipEventMap>(event: K, cb: AudioClipEventMap[K]): AudioClip`

Removes a specific listener from an event.

- `event: K` – Event name.
- `cb: AudioClipEventMap[K]` – The **same** callback reference that was previously added.

Returns:

- `AudioClip` – The same instance, for chaining.

---

### `ClearEventListeners(event?: keyof AudioClipEventMap): AudioClip`

Clears event listeners.

- `event?: keyof AudioClipEventMap`  
  - If provided, clears listeners only for that event.
  - If omitted, clears listeners for **all** events.

Returns:

- `AudioClip` – The same instance, for chaining.

---

### `GetChannelData(channel: number = 0): Float32Array`

Returns the raw PCM data for a given channel from the underlying `AudioBuffer`.

- `channel: number = 0` – Zero-based channel index.

Returns:

- `Float32Array` – The channel data.

---

### `EnablePreAnalyser(): boolean`

Enables the pre-analyser and rebuilds the node chain.

Behavior:

- Requires the clip to be attached and a parential channel/context to be present.
- Creates a new `AnalyserNode` if needed using `preAnalyserOptions`.
- Allocates `preAnalyserFloatArrayBuffer` and `preAnalyserByteArrayBuffer` with `fftSize` length.
- Sets `preAnalyserEnabled = true`.
- Rebuilds the internal node graph so the pre-analyser is placed **before** the gain node.

Returns:

- `true` – When enabling succeeded.
- `false` – When the clip is not attached or the context is missing.

---

### `DisablePreAnalyser(): boolean`

Disables the pre-analyser and rebuilds the node chain to bypass it.

Returns:

- `true` – When the node chain was rebuilt successfully.
- `false` – When rebuilding fails.

---

### `EnablePostAnalyser(): boolean`

Enables the post-analyser and rebuilds the node chain.

Behavior:

- Creates the `postAnalyser` node if needed using `postAnalyserOptions`.
- Allocates `postAnalyserFloatArrayBuffer` and `postAnalyserByteArrayBuffer`.
- Sets `postAnalyserEnabled = true`.
- Places the analyser **after** the panner node in the chain.

Returns:

- `true` – When enabling succeeded.
- `false` – When the clip is not attached or the context is missing.

---

### `DisablePostAnalyser(): boolean`

Disables the post-analyser and rebuilds the node chain to bypass it.

Returns:

- `true` – When the node chain was rebuilt successfully.
- `false` – When rebuilding fails.

---

### `SetPreAnalyserOptions(options: AnalyserOptions): void`

Sets options for the pre-analyser node.

- `options: AnalyserOptions` – Options such as `fftSize`, `minDecibels`, `maxDecibels`, `smoothingTimeConstant`.

Behavior:

- Updates `preAnalyserOptions`.
- If the pre-analyser already exists, applies the options directly to the node.

---

### `SetPostAnalyserOptions(options: AnalyserOptions): void`

Sets options for the post-analyser node.

- `options: AnalyserOptions` – Same structure as for the pre-analyser.

Behavior:

- Updates `postAnalyserOptions`.
- If the post-analyser already exists, applies the options directly to the node.

---

### `SetAnalyserOption(analyserType: AudioClipAnalyserType, property: AudioClipAnalyserProperty, value: number): boolean`

Updates a **single** analyser property on either the pre- or post-analyser.

- `analyserType: AudioClipAnalyserType` – `"pre"` or `"post"`.
- `property: AudioClipAnalyserProperty` – `"fftSize" | "minDecibels" | "maxDecibels" | "smoothingTimeConstant"`.
- `value: number` – The new value.

Behavior:

- Updates the corresponding property on the actual `AnalyserNode`.
- Also updates the cached options object (`preAnalyserOptions` or `postAnalyserOptions`).

Returns:

- `true` – When the property was updated.
- `false` – When the property or analyser type is invalid.

---

### `GetWaveformFloatData(analyserType: AudioClipAnalyserType): Float32Array | null`

Gets time-domain waveform data as floats from the selected analyser.

- `analyserType: AudioClipAnalyserType` – `"pre"` or `"post"`.

Returns:

- `Float32Array` – The internal float buffer filled with time-domain data.
- `null` – When the requested analyser is not enabled.

---

### `GetWaveformByteData(analyserType: AudioClipAnalyserType): Uint8Array | null`

Gets time-domain waveform data as bytes from the analysers.

- `analyserType: AudioClipAnalyserType` – `"pre"` or `"post"`.

Returns:

- `Uint8Array` – The internal byte buffer for the requested analyser.
- `null` – When analysers are not enabled.

---

## Events

### `"progress"`

Emitted periodically while the clip is playing.

Payload type (simplified):

```ts
type ProgressPayload = {
    current: number;          // Current playback position in seconds
    startTime: number;        // AudioContext timestamp when playback started
    offset: number;           // Offset in seconds at which playback started
    contextTimestamp: number; // Current AudioContext.currentTime
    formatted: string;        // Human readable time, e.g. "01:23"
};
```

Registered via:

```ts
clip.AddEventListener("progress", (event) => {
    console.log(event.current, event.formatted);
});
```

---

## Getters

### `get currentPlaybackTime(): number`

Returns the current playback time in seconds relative to the start of the buffer.

- Returns `0` when the clip is not playing or no audio context is available.
- Otherwise: `offsetAtStart + (audioContext.currentTime - startTime)`.

---

### `get duration(): number`

Total duration of the underlying audio buffer in seconds.

```ts
class AudioClip {
    public get duration(): number;
}
```

---

### `get formattedDuration(): string`

Duration formatted as `"mm:ss"`.

```ts
class AudioClip {
    public get formattedDuration(): string;
}
```

---

### `get sampleRate(): number`

Sample rate of the underlying `AudioBuffer`.

```ts
class AudioClip {
    public get sampleRate(): number;
}
```

---

### `get numberOfChannels(): number`

Number of channels in the underlying `AudioBuffer`.

```ts
class AudioClip {
    public get numberOfChannels(): number;
}
```

---

### `get byteLength(): number`

Byte length of the original `ArrayBuffer` used to construct this clip.

```ts
class AudioClip {
    public get byteLength(): number;
}
```
