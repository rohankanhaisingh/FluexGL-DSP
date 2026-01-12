import { Debug } from "./debugger";
import { ErrorCodes } from "../console-codes";

export let hasInitializedWasm: boolean = false;
export let compiledWebAssemblyModule: WebAssembly.Module | null = null;

export async function LoadWebAssemblyModule(path: string): Promise<WebAssembly.Module> {
    return new Promise(function (resolve, reject) {
        WebAssembly.compileStreaming(fetch(path)).then(function (module: WebAssembly.Module) {
            compiledWebAssemblyModule = module;
            resolve(module);
        }).catch(function (error: Error) {
            
            Debug.Error("Failed to load WebAssembly module from path: " + path, [
                "Make sure the path is correct and the server is serving the .wasm file with the correct MIME type (application/wasm).",
                "Error details: " + error.message
            ], ErrorCodes.WASM_COMPILATION_ERROR);
            reject(error);
        });
    });
}