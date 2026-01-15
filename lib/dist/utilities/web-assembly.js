import { Debug } from "./debugger";
import { ErrorCodes } from "../console-codes";
export let hasInitializedWasm = false;
export let compiledWebAssemblyModule = null;
export async function LoadWebAssemblyModule(path) {
    return new Promise(function (resolve, reject) {
        WebAssembly.compileStreaming(fetch(path)).then(function (module) {
            compiledWebAssemblyModule = module;
            resolve(module);
        }).catch(function (error) {
            Debug.Error("Failed to load WebAssembly module from path: " + path, [
                "Make sure the path is correct and the server is serving the .wasm file with the correct MIME type (application/wasm).",
                "Error details: " + error.message
            ], ErrorCodes.WASM_COMPILATION_ERROR);
            reject(error);
        });
    });
}
