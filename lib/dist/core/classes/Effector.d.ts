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
    addEventListener<K extends keyof EffectorEventMap>(event: K, cb: EffectorEventMap[K]): () => void;
    once<K extends keyof EffectorEventMap>(event: K, cb: EffectorEventMap[K]): () => void;
    removeEventListener<K extends keyof EffectorEventMap>(event: K, cb: EffectorEventMap[K]): Effector;
    clearEventListeners(event?: keyof EffectorEventMap): Effector;
    abstract initializeOnAttachment(context: AudioContext): Promise<void>;
}
//# sourceMappingURL=Effector.d.ts.map