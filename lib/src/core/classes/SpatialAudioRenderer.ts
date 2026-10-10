import { v4 } from "uuid";

import { Master } from "./Master";
import { Channel } from "./Channel";
import { Effector } from "./Effector";
import { SpatialAudioSource } from "./SpatialAudioSource";
import { SpatialAudioVoice, SpatialVoiceParameters } from "./SpatialAudioVoice";
import type { Sound, SoundInstance } from "./Sound";
import { Reverb } from "../../effects/classes/Reverb";
import { Limiter } from "../../effects/classes/Limiter";
import { Debug } from "../../utilities/debugger";
import { ErrorCodes } from "../../console-codes";
import { hasInitializedWasm } from "../../utilities/web-assembly";
import {
    SpatialAttenuationOptions,
    SpatialAudioRendererOptions,
    SpatialAudioSourceOptions,
    SpatialClusteringOptions,
    SpatialPanningModel,
    SpatialSourceState,
    SoundPlayAtOptions,
    Vector2,
    Vector3
} from "../../typings";

import type { AudioDevice } from "./AudioDevice";

export type ResolvedSpatialRendererOptions = Omit<SpatialAudioRendererOptions, "clustering" | "limiter" | "output">;

/** Multiplier on the clustering thresholds before a member is kicked out of its cluster. Prevents flapping. */
const CLUSTER_HYSTERESIS: number = 1.25;

/** A source becomes audible again at this multiple of the silence threshold. Prevents flapping. */
const AUDIBLE_HYSTERESIS: number = 2;

/** A virtual source takes over a voice only when it is this much louder than the quietest rendered source. */
const VOICE_STEAL_FACTOR: number = 1.5;

/** Maximum number of sources kept for reuse by playAt(). */
const MAX_POOLED_SOURCES: number = 256;

/** A gain change smaller than this fraction is not sent to the audio thread. */
const GAIN_DEADBAND: number = 0.005;

/**
 * Sources above or below this elevation are "polar": their azimuth says little about their
 * direction, so cluster forming compares them with every other source instead of only with
 * neighbours in azimuth.
 */
const POLAR_ELEVATION: number = Math.PI / 3;

const FORWARD: Vector3 = { x: 0, y: 0, z: 1 };

const TWO_PI: number = Math.PI * 2;

const DEFAULT_OPTIONS: ResolvedSpatialRendererOptions = {
    label: null,
    distanceModel: "inverse",
    refDistance: 50,
    maxDistance: 1500,
    rolloffFactor: 1,
    smoothing: 0.05,
    crossfadeTime: 0.12,
    lowpassMaxFrequency: 20000,
    lowpassMinFrequency: 600,
    rearLowpassFactor: 0.6,
    reverbMinSend: 0.05,
    reverbMaxSend: 0.6,
    silenceThreshold: 0.001,
    maxVoices: 64,
    loopVirtualizationDelay: 0.5
}

const DEFAULT_CLUSTERING: SpatialClusteringOptions = {
    enabled: true,
    splitDistance: 300,
    mergeDistance: 400,
    maxAngle: Math.PI / 12,
    maxDistanceRatio: 0.35,
    maxMembers: 16
}

interface SpatialSourceParameters extends SpatialVoiceParameters {
    /** Weight of the source within a cluster, based on its effective gain. */
    weight: number;
}

export interface SpatialRendererStats {
    sources: number;
    audible: number;
    /** Audible sources without a voice, because the voice budget is in use by louder sources. */
    virtual: number;
    voices: number;
    clusters: number;
    /** Empty voices kept for reuse. */
    pooledVoices: number;
    /** Looping sound instances whose audio node is released, because their source has no voice. */
    suspendedLoops: number;
}

export interface SpatialClusterInfo {
    voiceId: string;
    isCluster: boolean;
    sourceIds: string[];
    azimuth: number;
    elevation: number;
    distance: number;
}

/**
 * Shared implementation of the 2D and 3D spatial audio renderers.
 *
 * The renderer sends its sound to its own master channel, or to the `output` given in the options
 * (for example a bus channel). Every source can be routed to its own bus as well (see
 * {@link SpatialAudioSource.bus}); sources only share a voice with sources on the same bus. Per source, the distance to the listener
 * determines the volume, the cutoff of a lowpass filter (air absorption) and the amount
 * of reverb. The direction determines the panning.
 *
 * Far away sources that are in roughly the same direction are clustered: they share a
 * single voice (lowpass, panner and reverb send). Once the listener comes close, the
 * cluster is split again and every source gets its own voice.
 *
 * Subclasses only have to convert a source position into listener space.
 */
export abstract class SpatialAudioRenderer {

    public id: string = v4();
    public label: string | null = null;

    public context: AudioContext;

    /** The master channel of the renderer. Null when the output given in the options is a (bus) channel. */
    public master: Master | null;

    /** Where the sound (and reverb) of the renderer goes, unless a source has a bus of its own. */
    public output: Channel | Master;

    /** Bus that receives the reverb sends of all voices. Sent into the output. */
    public reverbChannel: Channel;
    public reverbEffect: Effector | null = null;

    /** Safety limiter on the output, so many sources at once do not clip. Null when disabled. */
    public limiter: Limiter | null = null;

    public sources: SpatialAudioSource[] = [];
    public voices: SpatialAudioVoice[] = [];

    public options: ResolvedSpatialRendererOptions;
    public clustering: SpatialClusteringOptions;

    /** Panning model used for newly created voices. */
    protected abstract panningModel: SpatialPanningModel;

    /** Empty voices kept for reuse, so voices (and their HRTF panners) are not constantly recreated. */
    private voicePool: SpatialAudioVoice[] = [];

    /** Sources kept for reuse by playAt(), so one-shots do not create audio nodes every time. */
    private sourcePool: SpatialAudioSource[] = [];

    private disposed: boolean = false;

    private useDefaultReverb: boolean = true;
    private animationFrameId: number | null = null;
    private intervalId: number | null = null;

    constructor(target: AudioDevice | AudioContext, options?: Partial<SpatialAudioRendererOptions>) {

        const { clustering, limiter, output, ...rest } = options ?? {};

        this.options = { ...DEFAULT_OPTIONS, ...rest };
        this.clustering = { ...DEFAULT_CLUSTERING, ...clustering };
        this.label = this.options.label;

        this.validateClusteringOptions();

        this.context = target instanceof BaseAudioContext ? target : target.context;

        if (output) {

            if (output.context !== this.context) Debug.error("The output of the SpatialAudioRenderer does not share the same AudioContext as the renderer.", [
                `Output id: ${output.id}`
            ], ErrorCodes.CHANNEL_NOT_SAME_AUDIO_CONTEXT);

            this.output = output;
            this.master = output instanceof Master ? output : null;
        } else {
            this.master = target instanceof BaseAudioContext ? new Master(target) : target.createMasterChannel();
            this.output = this.master;
        }

        // The limiter is on by default for the renderer's own master, but a given output is owned by the game.
        if (output ? limiter !== undefined && limiter !== false : limiter !== false) {
            this.limiter = new Limiter(typeof limiter === "object" ? limiter : undefined);
            this.output.attachEffect(this.limiter);
        }

        this.reverbChannel = new Channel(this.context, "Spatial reverb");
        this.reverbChannel.send(this.output);

        this.applyReverbEffect(null);
        this.ensureDefaultReverb();
    }

    /**
     * Converts the position of a source into listener space. x = right, y = up, z = forward.
     */
    protected abstract toLocal(source: SpatialAudioSource): Vector3;

    /**
     * The default reverb runs on an AudioWorklet, which requires WebAssembly. Until the
     * DSP pipeline is initialized the reverb bus stays muted, after which the default
     * reverb is attached automatically, unless a custom effect has been set.
     */
    private ensureDefaultReverb(): void {

        if (!this.useDefaultReverb || this.reverbEffect || !hasInitializedWasm) return;

        this.applyReverbEffect(new Reverb({ mix: 1, roomSize: 0.6, damping: 0.4 }));
    }

    private validateClusteringOptions(): void {

        if (this.clustering.mergeDistance > this.clustering.splitDistance) return;

        Debug.warn("Clustering mergeDistance should be larger than splitDistance. Adjusting mergeDistance.", [
            `splitDistance: ${this.clustering.splitDistance}`,
            `mergeDistance: ${this.clustering.mergeDistance}`
        ]);

        this.clustering.mergeDistance = this.clustering.splitDistance * 1.25;
    }

    /**
     * Replaces the effect on the reverb bus. Passing null removes the reverb, and mutes the bus.
     */
    public setReverbEffect(effect: Effector | null): this {

        this.useDefaultReverb = false;
        return this.applyReverbEffect(effect);
    }

    private applyReverbEffect(effect: Effector | null): this {

        if (this.reverbEffect)
            this.reverbChannel.removeEffect(this.reverbEffect);

        this.reverbEffect = effect;

        if (effect)
            this.reverbChannel.addEffect(effect);

        // Without an effect, the bus would just add a dry copy of the signal.
        if (this.reverbChannel.gainNode)
            this.reverbChannel.gainNode.gain.value = effect ? 1 : 0;

        return this;
    }

    /**
     * Plays a sound at a position, fire-and-forget: for sounds that do not belong to a long-living
     * object, such as explosions, impacts, collisions and bullet hits. The source is borrowed from a
     * pool and returned once the sound has ended.
     *
     * One-shots that are inaudible when they start (too far away) are skipped entirely, unless
     * `cull` is false. Returns null when the sound was skipped, either because of that or because
     * of the limits of the sound (maxInstances, minInterval).
     *
     * @example
     * ```
     * renderer.playAt(explosion, { x: 400, y: 0, z: -900 }, { bus: effectsBus });
     *
     * // A sound that follows a moving object:
     * const whoosh = renderer.playAt(rocketLoop, rocket.position, { loop: true });
     * whoosh?.setPosition(rocket.x, rocket.y, rocket.z); // every frame
     * whoosh?.stop(0.1);                                // on impact
     * ```
     */
    public playAt(sound: Sound, position: Vector2 | Vector3, options?: Partial<SoundPlayAtOptions>): SoundInstance | null {

        if (this.disposed) return null;

        const { volume, pitch, loop, offset, when, cull, ...sourceOptions } = options ?? {};
        const source: SpatialAudioSource = this.sourcePool.pop() ?? new SpatialAudioSource();

        source.reset({ ...sourceOptions, position, volume: sound.options.volume * (volume ?? 1) });

        if (cull !== false && !(loop ?? sound.options.loop)) {

            const gain: number = source.volume * this.computeSourceState(source).attenuation;

            if (gain < this.options.silenceThreshold) {
                this.sourcePool.push(source);
                return null;
            }
        }

        source.initialize(this, this.context);

        const self: SpatialAudioRenderer = this;
        const instance: SoundInstance | null = sound.createInstance({
            context: this.context,
            destination: source.input as AudioNode,
            options: { volume, pitch, loop, offset, when },
            owner: source,
            exclusive: true,
            release: function () {
                self.recycleSource(source);
            }
        });

        if (!instance) {
            this.sourcePool.push(source);
            return null;
        }

        this.addSource(source);
        return instance;
    }

    /**
     * Removes a source borrowed by playAt(), and puts it back in the pool once its voice has faded out.
     */
    private recycleSource(source: SpatialAudioSource): void {

        this.removeSource(source, false);

        if (this.disposed) return source.dispose();

        const self: SpatialAudioRenderer = this;

        setTimeout(function () {
            if (!self.disposed && self.sourcePool.length < MAX_POOLED_SOURCES) self.sourcePool.push(source);
            else source.dispose();
        }, this.options.crossfadeTime * 1000 + 50);
    }

    public createSource(options?: Partial<SpatialAudioSourceOptions>): SpatialAudioSource {

        const source: SpatialAudioSource = new SpatialAudioSource(options);

        this.addSource(source);
        return source;
    }

    public addSource(source: SpatialAudioSource): this {

        if (this.sources.includes(source)) return this;

        if (source.renderer && source.renderer !== this)
            source.renderer.removeSource(source, false);

        source.initialize(this, this.context);
        this.sources.push(source);
        this.prepareSource(source);
        return this;
    }

    /**
     * Renders a newly added source right away, without fading in, so a clip played
     * directly after adding the source keeps its attack (for example a gunshot).
     * The next update() may still move it into a cluster, with a crossfade.
     */
    private prepareSource(source: SpatialAudioSource): void {

        if (!source.isInitialized || source.voice) return;

        const state: SpatialSourceState = this.computeSourceState(source);
        const gain: number = source.volume * state.attenuation;

        source.state = state;
        source.audible = gain >= this.options.silenceThreshold;
        source.renderedGain = source.audible ? gain : 0;

        (source.output as GainNode).gain.setValueAtTime(source.renderedGain, this.context.currentTime);

        const voice: SpatialAudioVoice | null = source.audible ? this.giveVoice(source, 0) : null;

        voice?.setParameters(this.computeSourceParameters(source, state, gain), this.options.smoothing);
    }

    /**
     * Removes the source from the renderer. By default the source is disposed as well.
     */
    public removeSource(source: SpatialAudioSource, dispose: boolean = true): this {

        const idx: number = this.sources.indexOf(source);

        if (idx === -1) return this;

        this.sources.splice(idx, 1);
        this.releaseVoice(source);

        source.renderer = null;
        source.audible = false;
        source.state = null;

        if (dispose) {
            const crossfadeTime: number = this.options.crossfadeTime;

            setTimeout(function () {
                source.dispose();
            }, crossfadeTime * 1000 + 100);
        } else if (source.output) {
            source.output.gain.setTargetAtTime(0, this.context.currentTime, this.options.smoothing);
        }

        return this;
    }

    /**
     * Calculates the position of a source relative to the listener.
     */
    public computeSourceState(source: SpatialAudioSource): SpatialSourceState {

        const attenuation: SpatialAttenuationOptions = this.resolveAttenuation(source);
        const local: Vector3 = this.toLocal(source);

        const distance: number = length(local);
        const range: number = Math.max(attenuation.maxDistance - attenuation.refDistance, 1e-6);

        return {
            local,
            direction: unit(local),
            distance,
            azimuth: Math.atan2(local.x, local.z),
            elevation: Math.atan2(local.y, Math.hypot(local.x, local.z)),
            attenuation: computeAttenuation(distance, attenuation),
            normalizedDistance: clamp((distance - attenuation.refDistance) / range, 0, 1)
        }
    }

    /**
     * Updates all sources and voices. Call this once per frame from your own loop,
     * or use .start() to let the renderer update itself.
     */
    public update(): this {

        const now: number = this.context.currentTime;
        const { smoothing, silenceThreshold } = this.options;

        const parameters: Map<SpatialAudioSource, SpatialSourceParameters> = new Map();

        this.ensureDefaultReverb();

        for (const source of this.sources) {

            if (!source.isInitialized) continue;

            const state: SpatialSourceState = this.computeSourceState(source);
            const gain: number = source.volume * state.attenuation;

            source.state = state;
            source.audible = source.audible
                ? gain >= silenceThreshold
                : gain >= silenceThreshold * AUDIBLE_HYSTERESIS;

            // Only send gain changes that are large enough to matter; every call is a message to the audio thread.
            const target: number = source.audible ? gain : 0;
            const previous: number = source.renderedGain;

            if (Math.abs(target - previous) > Math.max(1e-4, previous * GAIN_DEADBAND) || (target === 0) !== (previous === 0)) {
                (source.output as GainNode).gain.setTargetAtTime(target, now, smoothing);
                source.renderedGain = target;
            }

            parameters.set(source, this.computeSourceParameters(source, state, gain));
        }

        this.assignVoices();

        for (const voice of this.voices)
            voice.setParameters(mixParameters(voice, parameters), smoothing);

        this.virtualizeLoops(now);

        return this;
    }

    /**
     * Suspends the looping sounds of sources that have been without a voice for a while, and resumes
     * them once the source has a voice again. Nobody hears a source without a voice, so there is no
     * reason to keep its AudioBufferSourceNodes running.
     */
    private virtualizeLoops(now: number): void {

        const delay: number = this.options.loopVirtualizationDelay;

        for (const source of this.sources) {

            if (source.soundInstances.size === 0) {
                source.virtualSince = null;
                continue;
            }

            if (source.voice) {

                if (source.virtualSince === null) continue;

                source.virtualSince = null;

                for (const instance of source.soundInstances)
                    instance.resume();

                continue;
            }

            if (source.virtualSince === null) source.virtualSince = now;

            if (now - source.virtualSince < delay) continue;

            for (const instance of source.soundInstances)
                instance.suspend();
        }
    }

    /**
     * Starts updating the renderer every animation frame.
     */
    public start(): this {

        if (this.animationFrameId !== null || this.intervalId !== null) return this;

        const self: SpatialAudioRenderer = this;

        if (typeof requestAnimationFrame === "undefined") {
            this.intervalId = setInterval(function () { self.update(); }, 16) as unknown as number;
            return this;
        }

        const loop = function () {
            self.update();
            self.animationFrameId = requestAnimationFrame(loop);
        }

        this.animationFrameId = requestAnimationFrame(loop);
        return this;
    }

    public stop(): this {

        if (this.animationFrameId !== null) cancelAnimationFrame(this.animationFrameId);
        if (this.intervalId !== null) clearInterval(this.intervalId);

        this.animationFrameId = null;
        this.intervalId = null;
        return this;
    }

    public get isRunning(): boolean {
        return this.animationFrameId !== null || this.intervalId !== null;
    }

    /**
     * Returns how sources are currently grouped into voices. Useful for debugging and visualization.
     */
    public getClusters(): SpatialClusterInfo[] {

        return this.voices.map(function (voice: SpatialAudioVoice): SpatialClusterInfo {

            const sources: SpatialAudioSource[] = Array.from(voice.members);
            const state: SpatialSourceState | null = sources[0]?.state ?? null;
            const direction: Vector3 = voice.isCluster ? voice.centroidDirection : state ? state.direction : FORWARD;

            return {
                voiceId: voice.id,
                isCluster: voice.isCluster,
                sourceIds: sources.map(source => source.id),
                azimuth: Math.atan2(direction.x, direction.z),
                elevation: Math.atan2(direction.y, Math.hypot(direction.x, direction.z)),
                distance: voice.isCluster ? voice.centroidDistance : state?.distance ?? 0
            }
        });
    }

    /**
     * Returns counters that show how the renderer is doing. Useful for debugging and tuning maxVoices.
     */
    public getStats(): SpatialRendererStats {

        let audible = 0, virtual = 0, suspendedLoops = 0;

        for (const source of this.sources) {
            if (source.audible) audible++;
            if (source.isVirtual) virtual++;

            for (const instance of source.soundInstances)
                if (instance.isSuspended) suspendedLoops++;
        }

        return {
            sources: this.sources.length,
            audible,
            virtual,
            voices: this.voices.length,
            clusters: this.voices.filter(voice => voice.isCluster).length,
            pooledVoices: this.voicePool.length,
            suspendedLoops
        }
    }

    /**
     * Throws away all voices. They are rebuilt (with crossfades) on the next update,
     * for example after the panning model has changed.
     */
    protected rebuildVoices(): void {

        for (const source of this.sources)
            source.voice = null;

        for (const voice of this.voices)
            voice.dispose(this.options.crossfadeTime);

        for (const voice of this.voicePool)
            voice.dispose(0);

        this.voices = [];
        this.voicePool = [];
    }

    public dispose(): void {

        this.stop();
        this.disposed = true;

        for (const source of this.sourcePool)
            source.dispose();

        this.sourcePool = [];

        for (const source of Array.from(this.sources))
            this.removeSource(source, true);

        for (const voice of this.voices.concat(this.voicePool))
            voice.dispose(0);

        this.voices = [];
        this.voicePool = [];

        this.reverbChannel.dispose();

        if (this.limiter && this.output.effects.includes(this.limiter))
            this.output.detachEffect(this.limiter);
    }

    /**
     * The node the dry sound of a source goes to: the input of its bus, or the output of the renderer.
     */
    private resolveDestination(source: SpatialAudioSource): AudioNode {
        return (source.bus?.input ?? this.output.input) as AudioNode;
    }

    private resolveAttenuation(source: SpatialAudioSource): SpatialAttenuationOptions {
        return {
            distanceModel: source.attenuation.distanceModel ?? this.options.distanceModel,
            refDistance: source.attenuation.refDistance ?? this.options.refDistance,
            maxDistance: source.attenuation.maxDistance ?? this.options.maxDistance,
            rolloffFactor: source.attenuation.rolloffFactor ?? this.options.rolloffFactor
        }
    }

    private computeSourceParameters(source: SpatialAudioSource, state: SpatialSourceState, gain: number): SpatialSourceParameters {

        const o: ResolvedSpatialRendererOptions = this.options;
        const refDistance: number = source.attenuation.refDistance ?? o.refDistance;
        const nyquist: number = this.context.sampleRate / 2;
        const direction: Vector3 = state.direction;

        let cutoff: number = o.lowpassMaxFrequency;

        if (source.airAbsorption) {

            // Interpolate logarithmically, so the filter closes evenly to the ear.
            cutoff = o.lowpassMaxFrequency * Math.pow(o.lowpassMinFrequency / o.lowpassMaxFrequency, state.normalizedDistance);

            // Sources behind the listener sound slightly duller.
            const behind: number = Math.max(0, -direction.z);
            cutoff *= 1 + (o.rearLowpassFactor - 1) * behind;
        }

        // Sources on top of the listener are centered, instead of jumping between left and right.
        const spread: number = clamp(state.distance / Math.max(refDistance, 1e-6), 0, 1);
        const pan: number = direction.x * spread;

        const reverbSend: number = (o.reverbMinSend + (o.reverbMaxSend - o.reverbMinSend) * Math.sqrt(state.normalizedDistance)) * source.reverbSendFactor;

        return {
            cutoff: clamp(cutoff, 10, nyquist),
            pan: clamp(pan, -1, 1),
            direction,
            reverbSend: Math.max(0, reverbSend),
            weight: Math.max(gain, 1e-6)
        }
    }

    private isClusterCandidate(source: SpatialAudioSource, inCluster: boolean): boolean {

        if (!this.clustering.enabled || !source.clusterable || !source.audible || !source.state) return false;

        return source.state.distance >= (inCluster ? this.clustering.splitDistance : this.clustering.mergeDistance);
    }

    /**
     * Whether a source is close enough (in direction and distance) to a cluster centre.
     * `cosLimit` is the cosine of the maximum angle, so no acos is needed per comparison.
     */
    private fitsCluster(state: SpatialSourceState, direction: Vector3, distance: number, tolerance: number, cosLimit: number): boolean {

        const d = state.direction;

        if (d.x * direction.x + d.y * direction.y + d.z * direction.z < cosLimit) return false;

        return Math.abs(state.distance - distance) <= this.clustering.maxDistanceRatio * tolerance * Math.max(distance, 1e-6);
    }

    /**
     * Decides which voice every source should be rendered by, and moves sources between voices.
     */
    private assignVoices(): void {

        const crossfadeTime: number = this.options.crossfadeTime;
        const clusters: SpatialAudioVoice[] = this.voices.filter(voice => voice.isCluster);

        const maxAngle: number = this.clustering.maxAngle;
        const cosLimit: number = Math.cos(Math.min(Math.PI, maxAngle));
        const cosLimitHysteresis: number = Math.cos(Math.min(Math.PI, maxAngle * CLUSTER_HYSTERESIS));

        // 1. Remove members that no longer belong in their cluster.
        for (const cluster of clusters) {

            updateCentroid(cluster);

            for (const source of Array.from(cluster.members)) {

                const stays: boolean = this.isClusterCandidate(source, true)
                    && this.resolveDestination(source) === cluster.destination
                    && this.fitsCluster(source.state as SpatialSourceState, cluster.centroidDirection, cluster.centroidDistance, CLUSTER_HYSTERESIS, cosLimitHysteresis);

                if (!stays) {
                    cluster.detach(source, crossfadeTime);
                    source.voice = null;
                }
            }

            updateCentroid(cluster);
        }

        // 2. Let loose candidates join the best fitting existing cluster.
        const loose: SpatialAudioSource[] = this.sources.filter(source => {
            return !(source.voice && source.voice.isCluster) && this.isClusterCandidate(source, false);
        });

        const unassigned: SpatialAudioSource[] = [];

        for (const source of loose) {

            const state: SpatialSourceState = source.state as SpatialSourceState;
            const destination: AudioNode = this.resolveDestination(source);

            let best: SpatialAudioVoice | null = null;
            let bestDot: number = -Infinity;

            for (const cluster of clusters) {

                if (cluster.size === 0 || cluster.size >= this.clustering.maxMembers || cluster.destination !== destination) continue;
                if (!this.fitsCluster(state, cluster.centroidDirection, cluster.centroidDistance, 1, cosLimit)) continue;

                // The smallest angle is the largest dot product.
                const c = cluster.centroidDirection;
                const dot: number = state.direction.x * c.x + state.direction.y * c.y + state.direction.z * c.z;

                if (dot > bestDot) {
                    best = cluster;
                    bestDot = dot;
                }
            }

            if (!best) {
                unassigned.push(source);
                continue;
            }

            this.moveSourceToVoice(source, best);
            updateCentroid(best);
        }

        // 3. Form new clusters from the remaining candidates.
        //
        //    Comparing every pair is O(n^2), which gets slow with hundreds of virtual sources. Instead, the
        //    candidates are sorted by azimuth and a seed is only compared with neighbours within an azimuth
        //    window. For two sources with |elevation| <= E, sin(angle / 2) >= cos(E) * sin(azimuthDiff / 2),
        //    so a window of 2 * asin(sin(maxAngle / 2) / cos(E)) never misses a match. Polar sources
        //    (|elevation| > E) are compared with every seed, and polar seeds with every source.
        const byAzimuth = (a: SpatialAudioSource, b: SpatialAudioSource) => (a.state as SpatialSourceState).azimuth - (b.state as SpatialSourceState).azimuth;
        const isPolar = (source: SpatialAudioSource) => Math.abs((source.state as SpatialSourceState).elevation) > POLAR_ELEVATION;

        unassigned.sort(byAzimuth);

        const polar: SpatialAudioSource[] = unassigned.filter(isPolar);
        const windowSine: number = Math.sin(Math.min(Math.PI, maxAngle) / 2) / Math.cos(POLAR_ELEVATION);
        const azimuthWindow: number = windowSine >= 1 ? Infinity : 2 * Math.asin(windowSine);
        const count: number = unassigned.length;
        const azimuths: number[] = unassigned.map(source => (source.state as SpatialSourceState).azimuth);
        const taken: Set<SpatialAudioSource> = new Set();

        // When the voice budget is full, a new cluster must be louder than this to take over a voice.
        // If even the loudest possible group cannot reach it, forming clusters is skipped entirely,
        // which keeps the cost low when many sources are virtual.
        let stealThreshold: number = this.stealThreshold();

        const loudestPossibleGroup: number = unassigned
            .map(source => source.renderedGain)
            .sort((a, b) => b - a)
            .slice(0, this.clustering.maxMembers)
            .reduce((sum, gain) => sum + gain, 0);

        for (let i = 0; i < count && loudestPossibleGroup > stealThreshold; i++) {

            const seed: SpatialAudioSource = unassigned[i];

            if (taken.has(seed)) continue;

            const seedState: SpatialSourceState = seed.state as SpatialSourceState;
            const seedDestination: AudioNode = this.resolveDestination(seed);
            const group: SpatialAudioSource[] = [seed];
            const inGroup: Set<SpatialAudioSource> = new Set([seed]);

            const consider = (other: SpatialAudioSource): void => {

                if (group.length >= this.clustering.maxMembers || taken.has(other) || inGroup.has(other)) return;
                if (this.resolveDestination(other) !== seedDestination) return;

                if (this.fitsCluster(other.state as SpatialSourceState, seedState.direction, seedState.distance, 1, cosLimit)) {
                    group.push(other);
                    inGroup.add(other);
                }
            };

            if (isPolar(seed) || azimuthWindow === Infinity) {

                for (const other of unassigned) consider(other);

            } else {

                // Walk outwards in both directions until the window is left. The candidates are sorted by
                // azimuth, so the distance is a plain subtraction, plus a full turn when wrapping around at +-PI.
                const seedAzimuth: number = azimuths[i];

                for (let k = 1; k < count && group.length < this.clustering.maxMembers; k++) {

                    const j: number = i + k;
                    const difference: number = j < count ? azimuths[j] - seedAzimuth : azimuths[j - count] + TWO_PI - seedAzimuth;

                    if (difference > azimuthWindow) break;

                    consider(unassigned[j < count ? j : j - count]);
                }

                for (let k = 1; k < count && group.length < this.clustering.maxMembers; k++) {

                    const j: number = i - k;
                    const difference: number = j >= 0 ? seedAzimuth - azimuths[j] : seedAzimuth + TWO_PI - azimuths[j + count];

                    if (difference > azimuthWindow) break;

                    consider(unassigned[j >= 0 ? j : j + count]);
                }

                for (const other of polar) consider(other);
            }

            if (group.length < 2) continue;

            // A new cluster costs a voice. When the budget is full, it has to win from the quietest voice.
            const loudness: number = group.reduce((sum, source) => sum + source.renderedGain, 0);

            if (loudness <= stealThreshold || !this.reserveVoice(loudness)) continue;

            stealThreshold = this.stealThreshold();

            const cluster: SpatialAudioVoice = this.createVoice(true, seedDestination);

            for (const source of group) {
                taken.add(source);
                this.moveSourceToVoice(source, cluster);
            }

            updateCentroid(cluster);
            clusters.push(cluster);
        }

        // 4. Dissolve clusters that have less than two members left.
        for (const cluster of clusters) {

            if (cluster.size >= 2) continue;

            for (const source of Array.from(cluster.members)) {
                cluster.detach(source, crossfadeTime);
                source.voice = null;
            }
        }

        // 5. Inaudible sources get no voice at all. Sources whose bus changed get a new voice.
        const waiting: SpatialAudioSource[] = [];

        for (const source of this.sources) {

            if (!source.isInitialized) continue;

            if (!source.audible || (source.voice && source.voice.destination !== this.resolveDestination(source)))
                this.releaseVoice(source);

            if (source.audible && !source.voice) waiting.push(source);
        }

        // 6. Stay within the voice budget, for example after a cluster split up or maxVoices was lowered:
        //    the quietest voices (clusters included) are released, and their sources become virtual.
        for (let over = this.activeVoiceCount() - this.options.maxVoices; over > 0; over--) {

            const quietest = this.quietestVoice();

            if (!quietest) break;

            this.releaseAllMembers(quietest);
        }

        // 7. The remaining audible sources get their own voice, loudest first, as long as the budget allows.
        //    Once a source cannot get a voice, every quieter source cannot either.
        waiting.sort((a, b) => b.renderedGain - a.renderedGain);

        for (const source of waiting) {
            if (!this.giveVoice(source, crossfadeTime)) break;
        }

        // 8. Move empty voices to the pool.
        const alive: SpatialAudioVoice[] = [];

        for (const voice of this.voices) {
            if (voice.size > 0) alive.push(voice);
            else this.poolVoice(voice);
        }

        this.voices = alive;
    }

    private activeVoiceCount(): number {

        let count = 0;

        for (const voice of this.voices)
            if (voice.size > 0) count++;

        return count;
    }

    /** Loudness of a voice: the summed gain of its sources. */
    private voiceLoudness(voice: SpatialAudioVoice): number {

        let loudness = 0;

        for (const source of voice.members)
            loudness += source.renderedGain;

        return loudness;
    }

    /** The quietest voice in use, cluster or not. */
    private quietestVoice(): SpatialAudioVoice | null {

        let quietest: SpatialAudioVoice | null = null;
        let quietestLoudness = Infinity;

        for (const voice of this.voices) {

            if (voice.size === 0) continue;

            const loudness = this.voiceLoudness(voice);

            if (loudness < quietestLoudness) {
                quietest = voice;
                quietestLoudness = loudness;
            }
        }

        return quietest;
    }

    private releaseAllMembers(voice: SpatialAudioVoice): void {
        for (const source of Array.from(voice.members))
            this.releaseVoice(source);
    }

    /**
     * The loudness a new voice needs to get a voice: 0 while the budget has room, otherwise
     * clearly louder than the quietest voice in use.
     */
    private stealThreshold(): number {

        if (this.activeVoiceCount() < this.options.maxVoices) return 0;

        const quietest = this.quietestVoice();

        return quietest ? this.voiceLoudness(quietest) * VOICE_STEAL_FACTOR : Infinity;
    }

    /**
     * Makes room for one new voice with the given loudness. When the budget is used up, the quietest
     * voice is released, but only when the new voice is clearly louder (prevents voices from flapping).
     * Returns false when there is no room.
     */
    private reserveVoice(loudness: number): boolean {

        if (this.activeVoiceCount() < this.options.maxVoices) return true;

        const quietest = this.quietestVoice();

        if (!quietest || loudness <= this.voiceLoudness(quietest) * VOICE_STEAL_FACTOR)
            return false;

        this.releaseAllMembers(quietest);
        return true;
    }

    /**
     * Gives an audible source its own voice, if the voice budget allows it. When the budget is used up,
     * the source takes over the quietest voice, but only when it is clearly louder.
     * Returns the new voice, or null when the source stays virtual.
     */
    private giveVoice(source: SpatialAudioSource, crossfadeTime: number): SpatialAudioVoice | null {

        if (!this.reserveVoice(source.renderedGain)) return null;

        const voice: SpatialAudioVoice = this.createVoice(false, this.resolveDestination(source));

        this.moveSourceToVoice(source, voice, crossfadeTime);
        return voice;
    }

    private createVoice(isCluster: boolean, destination: AudioNode): SpatialAudioVoice {

        // Reuse a pooled voice whose last tails have faded out, preferably one already connected to the same bus.
        const now: number = this.context.currentTime;

        let index: number = this.voicePool.findIndex(voice => voice.availableAt <= now && voice.destination === destination);

        if (index === -1)
            index = this.voicePool.findIndex(voice => voice.availableAt <= now);

        let voice: SpatialAudioVoice;

        if (index !== -1) {
            voice = this.voicePool.splice(index, 1)[0];
            voice.recycle(isCluster);
            voice.setDestination(destination);
        } else {
            voice = new SpatialAudioVoice(this.context, isCluster, this.panningModel, destination, this.reverbChannel.input as AudioNode);
        }

        this.voices.push(voice);
        return voice;
    }

    private poolVoice(voice: SpatialAudioVoice): void {

        voice.availableAt = this.context.currentTime + this.options.crossfadeTime + 0.05;

        if (voice.panningModel === this.panningModel && this.voicePool.length < this.options.maxVoices)
            this.voicePool.push(voice);
        else
            voice.dispose(this.options.crossfadeTime);
    }

    private moveSourceToVoice(source: SpatialAudioSource, voice: SpatialAudioVoice, crossfadeTime: number = this.options.crossfadeTime): void {

        if (source.voice === voice) return;

        this.releaseVoice(source);

        voice.attach(source, crossfadeTime);
        source.voice = voice;
    }

    private releaseVoice(source: SpatialAudioSource): void {

        if (!source.voice) return;

        source.voice.detach(source, this.options.crossfadeTime);
        source.voice = null;
    }
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}

function length(v: Vector3): number {
    return Math.hypot(v.x, v.y, v.z);
}

function unit(v: Vector3): Vector3 {

    const l: number = length(v);

    return l < 1e-9 ? { ...FORWARD } : { x: v.x / l, y: v.y / l, z: v.z / l };
}


/**
 * Same formulas as the Web Audio PannerNode, with an additional fade towards
 * maxDistance, so sources actually become silent at maxDistance.
 */
function computeAttenuation(distance: number, options: SpatialAttenuationOptions): number {

    const { refDistance, maxDistance, rolloffFactor } = options;
    const d: number = clamp(distance, refDistance, maxDistance);

    let gain: number;

    switch (options.distanceModel) {
        case "linear":
            gain = 1 - clamp(rolloffFactor, 0, 1) * (d - refDistance) / Math.max(maxDistance - refDistance, 1e-6);
            break;
        case "exponential":
            gain = Math.pow(d / Math.max(refDistance, 1e-6), -rolloffFactor);
            break;
        case "inverse":
        default:
            gain = refDistance / Math.max(refDistance + rolloffFactor * (d - refDistance), 1e-6);
            break;
    }

    const fadeStart: number = refDistance + (maxDistance - refDistance) * 0.9;
    const fade: number = 1 - smoothstep(fadeStart, maxDistance, distance);

    return clamp(gain * fade, 0, 1);
}

function smoothstep(edge0: number, edge1: number, x: number): number {

    if (edge1 <= edge0) return x < edge0 ? 0 : 1;

    const t: number = clamp((x - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
}

function updateCentroid(voice: SpatialAudioVoice): void {

    let sum: Vector3 = { x: 0, y: 0, z: 0 }, distance: number = 0, n: number = 0;

    for (const source of voice.members) {

        if (!source.state) continue;

        const direction: Vector3 = source.state.direction;

        sum = { x: sum.x + direction.x, y: sum.y + direction.y, z: sum.z + direction.z };
        distance += source.state.distance;
        n++;
    }

    if (n === 0) return;

    voice.centroidDirection = unit(sum);
    voice.centroidDistance = distance / n;
}

/**
 * Combines the parameters of all members of a voice, weighted by their loudness.
 * The cutoff is averaged in the logarithmic domain.
 */
function mixParameters(voice: SpatialAudioVoice, parameters: Map<SpatialAudioSource, SpatialSourceParameters>): SpatialVoiceParameters {

    let weight: number = 0, logCutoff: number = 0, pan: number = 0, reverbSend: number = 0;
    let direction: Vector3 = { x: 0, y: 0, z: 0 };

    for (const source of voice.members) {

        const p: SpatialSourceParameters | undefined = parameters.get(source);

        if (!p) continue;

        weight += p.weight;
        logCutoff += Math.log(p.cutoff) * p.weight;
        pan += p.pan * p.weight;
        reverbSend += p.reverbSend * p.weight;
        direction = {
            x: direction.x + p.direction.x * p.weight,
            y: direction.y + p.direction.y * p.weight,
            z: direction.z + p.direction.z * p.weight
        };
    }

    if (weight === 0) return { cutoff: 20000, pan: 0, direction: { ...FORWARD }, reverbSend: 0 };

    return {
        cutoff: Math.exp(logCutoff / weight),
        pan: pan / weight,
        direction: unit(direction),
        reverbSend: reverbSend / weight
    }
}
