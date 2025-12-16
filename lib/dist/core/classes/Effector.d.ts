import { EffectorEventMap } from "../../typings";
export declare abstract class Effector {
    id: string;
    label: string | null;
    name: string;
    audioWorkletNode: AudioWorkletNode | null;
    context: AudioContext | null;
    private hasRegisteredMessageEventListener;
    private events;
    private handleIncomingMessages;
    protected registerMessageEventListener(node: AudioWorkletNode): void;
    AddEventListener<K extends keyof EffectorEventMap>(event: K, cb: EffectorEventMap[K]): () => void;
    Once<K extends keyof EffectorEventMap>(event: K, cb: EffectorEventMap[K]): () => void;
    RemoveEventListener<K extends keyof EffectorEventMap>(event: K, cb: EffectorEventMap[K]): Effector;
    ClearEventListeners(event?: keyof EffectorEventMap): Effector;
    abstract InitializeOnAttachment(context: AudioContext): Promise<void>;
}
//# sourceMappingURL=Effector.d.ts.map