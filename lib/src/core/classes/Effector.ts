import { v4 } from "uuid";

export abstract class Effector {
    
    public id: string = v4();
    public label: string | null = null;
    public name: string = "Effector";
    public audioWorkletNode: AudioWorkletNode | null = null;
    public parentialContext: AudioContext | null = null;

    public abstract InitializeOnAttachment(parentialContext: AudioContext): Promise<void>;
}