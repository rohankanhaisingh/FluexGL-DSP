# StrictMode on Effects

Prevents processing NaN and Infinite values.

## About

Every effect class instance has a StrictMode, which is disabled by default. Enabling StrictMode prevents AudioWorkletNodes from processing invalid values such as NaN or Infinity.

There is one downside, which is why StrictMode is disabled by default. When enabled, the AudioWorkletNode performs additional checks inside the processing loop. Each individual sample is validated under the hood to ensure it does not contain invalid values such as NaN or Infinity.

This is useful when an effect is attached to a channel but no sound is being produced. Keep in mind that enabling StrictMode on multiple effects can cause performance degradation. StrictMode should not be used in production environments.

## Usage

To enable StrictMode on an effect, use the ``StrictMode`` enum to turn it on or off. For example:

```ts
import { LowPassFilter, StrictMode } from "@fluex/fluexgl-dsp";

new LowPassFilter({ strictMode: StrictMode.Disabled });
```

This sends a signal to the AudioWorkletNode to perform additional checks inside the processing loop. To catch errors related to detected NaN or Infinity values, you can attach an event listener to the AudioWorkletNode. For example:

```ts
lowPassFilter.AddEventListener("incoming-processor-error", function(message) {
    // Do something with 'message'.
});
```

The error helps you understand what went wrong under the hood.