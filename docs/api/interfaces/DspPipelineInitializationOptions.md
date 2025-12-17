# DspPipelineInitializationOptions

An interface defining configuration options for initializing the DSP pipeline in **FluexGL DSP**.

```ts
export interface DspPipelineInitializationOptions {
    pathToWasm: string;
}
```

## About

The `DspPipelineInitializationOptions` interface specifies options used when initializing the DSP pipeline through the [`InitializeDspPipeline()`](../helpers/InitializeDspPipeline.md) function.  
It primarily defines the location of the WebAssembly file required by the DSP system.

## Properties

| Name | Type | Description |
|------|------|-------------|
| `pathToWasm` | `string` | The absolute or relative path to the WebAssembly file. This path is required during DSP pipeline initialization so the library can properly load and instantiate the WASM module. |

## Example

```ts
import { InitializeDspPipeline } from "@fluexgl/dsp";

async function main() {
    await InitializeDspPipeline({
        pathToWasm: "/wasm/fluex_dsp_wasm_bg.wasm"
    });
}
```
