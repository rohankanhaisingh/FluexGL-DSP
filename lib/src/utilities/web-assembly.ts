export let hasInitializedWasm: boolean = false;
export let compiledWebAssemblyModule: WebAssembly.Module | null = null;

export async function LoadWebAssemblyModule(path: string): Promise<WebAssembly.Module> {
    return new Promise(function (resolve, reject) {
        WebAssembly.compileStreaming(fetch(path)).then(function (module: WebAssembly.Module) {
            compiledWebAssemblyModule = module;
            resolve(module);
        }).catch(function (error: Error) {
            reject(error);
        });
    });
}