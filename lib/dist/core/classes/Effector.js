import { v4 } from "uuid";
export class Effector {
    id = v4();
    label = null;
    name = "Effector";
    audioWorkletNode = null;
    parentialContext = null;
}
