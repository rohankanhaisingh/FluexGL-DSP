import { v4 } from "uuid";

import { SpatialAudioSource } from "./SpatialAudioSource";
import { SpatialPanningModel, Vector3 } from "../../typings";

export interface SpatialVoiceParameters {
    cutoff: number;
    /** Stereo pan, used by the "stereo" panning model. */
    pan: number;
    /** Direction in listener space (x = right, y = up, z = forward), used by the 3D panning models. */
    direction: Vector3;
    reverbSend: number;
}

/**
 * A voice is the actual DSP chain that spatializes audio:
 *
 *   [source taps] -> input -> lowpass -> panner -> output (dry)  -> destination (bus)
 *                                              \-> reverbSend    -> reverb bus
 *
 * A voice either belongs to one source (individual), or is shared by
 * multiple far away sources in roughly the same direction (cluster).
 * The panner is a StereoPannerNode for the "stereo" panning model, or a
 * PannerNode (equalpower / HRTF) for the 3D panning models. The PannerNode
 * only handles direction; distance attenuation is done by the renderer.
 *
 * Every source keeps its own gain stage, so the loudness of each member
 * stays exact. Only the filter, panning and reverb send are shared.
 *
 * This class is managed by SpatialAudioRenderer2D and is not meant to be
 * used directly.
 */
export class SpatialAudioVoice {

    public id: string = v4();

    public members: Set<SpatialAudioSource> = new Set();

    public input: GainNode;
    public filter: BiquadFilterNode;
    public panner: StereoPannerNode | PannerNode;
    public output: GainNode;
    public reverbSend: GainNode;

    /** Node the dry output is connected to: the input of the bus of its sources. */
    public destination: AudioNode;

    /** Cluster centre as seen from the listener (unit vector in listener space). Only meaningful for cluster voices. */
    public centroidDirection: Vector3 = { x: 0, y: 0, z: 1 };
    public centroidDistance: number = 0;

    /** Audio context time from which a pooled voice may be reused (its last tails have faded out). */
    public availableAt: number = 0;

    private taps: Map<SpatialAudioSource, GainNode> = new Map();
    private hasParameters: boolean = false;
    private disposed: boolean = false;

    /** Last values sent to the audio thread, used to skip changes too small to hear. */
    private sent: { cutoff: number, pan: number, reverbSend: number, x: number, y: number, z: number } = {
        cutoff: 0, pan: 0, reverbSend: 0, x: 0, y: 0, z: 0
    };

    constructor(public context: AudioContext, public isCluster: boolean, public panningModel: SpatialPanningModel, dryDestination: AudioNode, reverbDestination: AudioNode) {

        this.input = new GainNode(context);
        // Butterworth response (no resonance peak). Q of a Web Audio lowpass is in dB: 20 * log10(1 / sqrt(2)).
        this.filter = new BiquadFilterNode(context, { type: "lowpass", Q: -3.0103 });
        this.panner = panningModel === "stereo"
            ? new StereoPannerNode(context)
            : new PannerNode(context, {
                panningModel,
                distanceModel: "linear",
                rolloffFactor: 0,
                refDistance: 1,
                maxDistance: 10000,
                positionZ: -1
            });
        this.output = new GainNode(context);
        this.reverbSend = new GainNode(context, { gain: 0 });

        this.input.connect(this.filter);
        this.filter.connect(this.panner);
        this.panner.connect(this.output);
        this.panner.connect(this.reverbSend);

        this.destination = dryDestination;

        this.output.connect(dryDestination);
        this.reverbSend.connect(reverbDestination);
    }

    /**
     * Moves the dry output to another bus. Only meant for empty (pooled) voices, since it is not crossfaded.
     */
    public setDestination(destination: AudioNode): void {

        if (this.destination === destination) return;

        try {
            this.output.disconnect(this.destination);
        } catch {
            // Not connected (anymore), which is the desired end state anyway.
        }

        this.output.connect(destination);
        this.destination = destination;
    }

    public get size(): number {
        return this.members.size;
    }

    public has(source: SpatialAudioSource): boolean {
        return this.members.has(source);
    }

    /**
     * Connects the output of a source to this voice, fading it in. A crossfade time of 0
     * connects it at full level immediately, which keeps the attack of new sounds intact.
     */
    public attach(source: SpatialAudioSource, crossfadeTime: number): void {

        if (this.members.has(source) || !source.output) return;

        const now: number = this.context.currentTime;
        const tap: GainNode = new GainNode(this.context, { gain: crossfadeTime > 0 ? 0 : 1 });

        source.output.connect(tap);
        tap.connect(this.input);

        if (crossfadeTime > 0) {
            tap.gain.setValueAtTime(0, now);
            tap.gain.linearRampToValueAtTime(1, now + crossfadeTime);
        }

        this.taps.set(source, tap);
        this.members.add(source);
    }

    /**
     * Fades the source out of this voice, and disconnects it afterwards.
     */
    public detach(source: SpatialAudioSource, crossfadeTime: number): void {

        const tap: GainNode | undefined = this.taps.get(source);

        this.members.delete(source);
        this.taps.delete(source);

        if (!tap) return;

        const now: number = this.context.currentTime;

        tap.gain.cancelScheduledValues(now);
        tap.gain.setValueAtTime(tap.gain.value, now);
        tap.gain.linearRampToValueAtTime(0, now + crossfadeTime);

        const output: AudioNode | null = source.output;

        setTimeout(function () {
            try { output?.disconnect(tap); } catch { /* Already disconnected. */ }
            tap.disconnect();
        }, crossfadeTime * 1000 + 50);
    }

    /**
     * Applies the parameters. Every automation call is a message to the audio thread, so a
     * parameter is only sent when it changed by more than an inaudible amount. With many
     * sources this keeps the audio thread from being flooded by automation events.
     */
    public setParameters(parameters: SpatialVoiceParameters, smoothing: number): void {

        const now: number = this.context.currentTime;
        const sent = this.sent;

        // A fresh voice jumps to its target, so it does not sweep in from default values.
        const immediate: boolean = !this.hasParameters;

        const set = function (param: AudioParam, value: number) {
            if (immediate) param.setValueAtTime(value, now);
            else param.setTargetAtTime(value, now, smoothing);
        }

        // Cutoff: 0.5% (well below the just noticeable difference in pitch/brightness).
        if (immediate || Math.abs(parameters.cutoff - sent.cutoff) > sent.cutoff * 0.005) {
            set(this.filter.frequency, parameters.cutoff);
            sent.cutoff = parameters.cutoff;
        }

        if (immediate || Math.abs(parameters.reverbSend - sent.reverbSend) > 0.002) {
            set(this.reverbSend.gain, parameters.reverbSend);
            sent.reverbSend = parameters.reverbSend;
        }

        if (this.panner instanceof StereoPannerNode) {

            if (immediate || Math.abs(parameters.pan - sent.pan) > 0.002) {
                set(this.panner.pan, parameters.pan);
                sent.pan = parameters.pan;
            }

        } else {

            const d = parameters.direction;

            // About 0.1 degree.
            if (immediate || Math.abs(d.x - sent.x) > 0.002 || Math.abs(d.y - sent.y) > 0.002 || Math.abs(d.z - sent.z) > 0.002) {

                // Web Audio's default listener sits at the origin facing -z, so forward maps to -z.
                set(this.panner.positionX, d.x);
                set(this.panner.positionY, d.y);
                set(this.panner.positionZ, -d.z);

                sent.x = d.x;
                sent.y = d.y;
                sent.z = d.z;
            }
        }

        this.hasParameters = true;
    }

    /**
     * Prepares an empty voice for reuse from the pool. The audio nodes stay connected;
     * the next setParameters() jumps straight to the new values.
     */
    public recycle(isCluster: boolean): void {
        this.isCluster = isCluster;
        this.hasParameters = false;
        this.centroidDirection = { x: 0, y: 0, z: 1 };
        this.centroidDistance = 0;
    }

    /**
     * Detaches all members and disconnects the voice once the crossfade has finished.
     */
    public dispose(crossfadeTime: number): void {

        if (this.disposed) return;
        this.disposed = true;

        for (const source of Array.from(this.members))
            this.detach(source, crossfadeTime);

        const self: SpatialAudioVoice = this;

        setTimeout(function () {
            self.input.disconnect();
            self.filter.disconnect();
            self.panner.disconnect();
            self.output.disconnect();
            self.reverbSend.disconnect();
        }, crossfadeTime * 1000 + 100);
    }
}
