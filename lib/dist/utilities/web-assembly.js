export let hasInitializedWasm = false;
export let compiledWebAssemblyModule = null;
export async function LoadWebAssemblyModule(path) {
    return new Promise(function (resolve, reject) {
        WebAssembly.compileStreaming(fetch(path)).then(function (module) {
            compiledWebAssemblyModule = module;
            resolve(module);
        }).catch(function (error) {
            reject(error);
        });
    });
}
