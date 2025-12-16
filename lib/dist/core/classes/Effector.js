import { v4 } from "uuid";
import { Debug } from "../../utilities/debugger";
export class Effector {
    id = v4();
    label = null;
    name = "Effector";
    audioWorkletNode = null;
    context = null;
    hasRegisteredMessageEventListener = false;
    events = {
        "incoming-processor-error": [],
        "incoming-processor-message": [],
        "incoming-processor-warning": [],
        "processor-wasm-instantiated": [],
        "initialized-on-channel-attachment": []
    };
    handleIncomingMessages(event) {
        const messageData = event.data;
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
    registerMessageEventListener(node) {
        if (this.hasRegisteredMessageEventListener)
            return;
        node.port.onmessage = this.handleIncomingMessages.bind(this);
        Debug.Log(`Succesfully registered event listener on effector ${this.name} (${this.label}) [${this.id}]`);
    }
    AddEventListener(event, cb) {
        this.events[event].push(cb);
        return () => this.RemoveEventListener(event, cb);
    }
    Once(event, cb) {
        const wrapper = ((...args) => {
            // @ts-ignore
            cb(...args);
            this.RemoveEventListener(event, wrapper);
        });
        return this.AddEventListener(event, wrapper);
    }
    RemoveEventListener(event, cb) {
        const arr = this.events[event];
        for (let i = 0; i < arr.length; i++) {
            if (arr[i] === cb) {
                arr.splice(i, 1);
                break;
            }
        }
        return this;
    }
    ClearEventListeners(event) {
        if (event) {
            this.events[event].length = 0;
        }
        else {
            Object.keys(this.events).forEach((k) => (this.events[k].length = 0));
        }
        return this;
    }
}
