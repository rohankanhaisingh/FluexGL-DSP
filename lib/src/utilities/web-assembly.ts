import { Master } from "./core/exports";
import { Debug } from "./utilities/debugger";
import { ConstructProcessorWorklet } from "./utilities/helpers";

export let hasInitializedWasm: boolean = false;
export let compiledWebAssemblyModule: WebAssembly.Module | null = null;

export async function LoadWebAssemblyModule(path: string): Promise<WebAssembly.Module> {

    return new Promise(function(resolve, reject) {
        WebAssembly.compileStreaming(fetch(path)).then(function(module: WebAssembly.Module) {
            compiledWebAssemblyModule = module;
            resolve(module);
        }).catch(function(error: Error) {
            reject(error);
        });
    })
}

export async function LoadWorkletOnMasterChannel(master: Master) {
    Debug.Log("Loading worklet modules on master channel...", [ `Channel ID: ${master.id}` ]);

    const context: AudioContext = master.context,
        start: number = Date.now();


    const end: number = Date.now(),
        difference: number = end - start;

    Debug.Success("Succesfully loaded audio processor worklets into master channel.", [
        `Executed in ${difference}ms.`,
    ]);

    return true;
}