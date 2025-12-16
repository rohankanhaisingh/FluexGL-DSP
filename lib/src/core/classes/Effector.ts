import { v4 } from "uuid";

import { IncomingProcessorMessage, IncomingMessageType, EffectorEvents, EffectorEventMap } from "../../typings";
import { Debug } from "../../utilities/debugger";

export abstract class Effector {

    public id: string = v4();
    public label: string | null = null;
    public name: string = "Effector";

    public audioWorkletNode: AudioWorkletNode | null = null;
    public context: AudioContext | null = null;

    private hasRegisteredMessageEventListener: boolean = false;

    private events: EffectorEvents = {
        "incoming-processor-error": [],
        "incoming-processor-message": [],
        "incoming-processor-warning": [],
        "processor-wasm-instantiated": [],
        "initialized-on-channel-attachment": []
    }

    private handleIncomingMessages(event: MessageEvent) {

        const messageData = event.data as IncomingProcessorMessage;
        
        switch (messageData.type) {
            case "message":
                return this.events["incoming-processor-message"].forEach(ev => ev(messageData));
            case "error":
                return this.events["incoming-processor-error"].forEach(ev => ev(messageData));
            case "warning":
                return this.events["incoming-processor-message"].forEach(ev => ev(messageData));
            case "wasm-instantiated":
                return this.events["processor-wasm-instantiated"].forEach(ev => ev(messageData));
        }
    }

    protected registerMessageEventListener(node: AudioWorkletNode) {
        if (this.hasRegisteredMessageEventListener) return;

        node.port.onmessage = this.handleIncomingMessages.bind(this);
        Debug.Log(`Succesfully registered event listener on effector ${this.name} (${this.label}) [${this.id}]`);
    }

    public AddEventListener<K extends keyof EffectorEventMap>(event: K, cb: EffectorEventMap[K]): () => void {

        this.events[event].push(cb);

        return () => this.RemoveEventListener(event, cb);
    }

    public Once<K extends keyof EffectorEventMap>(event: K, cb: EffectorEventMap[K]): () => void {

        const wrapper = ((...args: unknown[]) => {

            // @ts-ignore
            cb(...args);

            this.RemoveEventListener(event, wrapper as unknown as EffectorEventMap[K]);
        }) as unknown as EffectorEventMap[K];

        return this.AddEventListener(event, wrapper);
    }

    public RemoveEventListener<K extends keyof EffectorEventMap>(event: K, cb: EffectorEventMap[K]): Effector {

        const arr = this.events[event];

        for (let i = 0; i < arr.length; i++) {
            if (arr[i] === cb) {
                arr.splice(i, 1);
                break;
            }
        }
        return this;
    }

    public ClearEventListeners(event?: keyof EffectorEventMap): Effector {

        if (event) {
            this.events[event].length = 0;
        } else {
            (Object.keys(this.events) as (keyof EffectorEventMap)[]).forEach((k) => (this.events[k].length = 0));
        }

        return this;
    }

    public abstract InitializeOnAttachment(context: AudioContext): Promise<void>;
}
