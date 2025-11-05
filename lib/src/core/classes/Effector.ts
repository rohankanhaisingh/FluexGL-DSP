import { v4 } from "uuid";

import { Debug } from "../../utilities/debugger";

export abstract class Effector {
    
    public id: string = v4();
    public label: string | null = null;

    public gainNode: GainNode | null = null;
    public audioWorkletNode: AudioWorkletNode | null = null;

    public parentialContext: AudioContext | null = null;

    protected wasmInstance: any;

    public SetVolume(volume: number) {

        if(!this.gainNode || !this.parentialContext) return Debug.Error("Could not set volume on effector, because the gain node or the parential context is not defined.", [
            "Make sure to call '.AddEffect([effect Effector])' on a channel."
        ]);

        this.gainNode.gain.setValueAtTime(volume, this.parentialContext?.currentTime);
    }
    
    public GetVolume(): number {
        return this.gainNode?.gain.value ?? 0;
    }

    public abstract InitializeOnAttachment(parentialContext: AudioContext): Promise<void>;
}