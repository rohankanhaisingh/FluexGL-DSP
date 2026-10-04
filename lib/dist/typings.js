export var LowPassFilterMessageCommandId;
(function (LowPassFilterMessageCommandId) {
    LowPassFilterMessageCommandId[LowPassFilterMessageCommandId["SetCutoff"] = 0] = "SetCutoff";
    LowPassFilterMessageCommandId[LowPassFilterMessageCommandId["SetMinFrequency"] = 1] = "SetMinFrequency";
    LowPassFilterMessageCommandId[LowPassFilterMessageCommandId["SetQ"] = 2] = "SetQ";
})(LowPassFilterMessageCommandId || (LowPassFilterMessageCommandId = {}));
export var HighPassFilterMessageCommandId;
(function (HighPassFilterMessageCommandId) {
    HighPassFilterMessageCommandId[HighPassFilterMessageCommandId["SetCutoff"] = 0] = "SetCutoff";
    HighPassFilterMessageCommandId[HighPassFilterMessageCommandId["SetMaxFrequency"] = 1] = "SetMaxFrequency";
    HighPassFilterMessageCommandId[HighPassFilterMessageCommandId["SetQ"] = 2] = "SetQ";
})(HighPassFilterMessageCommandId || (HighPassFilterMessageCommandId = {}));
export var NotchFilterMessageCommandId;
(function (NotchFilterMessageCommandId) {
    NotchFilterMessageCommandId[NotchFilterMessageCommandId["SetCutoff"] = 0] = "SetCutoff";
    NotchFilterMessageCommandId[NotchFilterMessageCommandId["SetMinFrequency"] = 1] = "SetMinFrequency";
    NotchFilterMessageCommandId[NotchFilterMessageCommandId["SetQ"] = 2] = "SetQ";
})(NotchFilterMessageCommandId || (NotchFilterMessageCommandId = {}));
export var ChorusMessageCommandId;
(function (ChorusMessageCommandId) {
    ChorusMessageCommandId[ChorusMessageCommandId["SetBaseDelayMs"] = 0] = "SetBaseDelayMs";
    ChorusMessageCommandId[ChorusMessageCommandId["SetDepthMs"] = 1] = "SetDepthMs";
    ChorusMessageCommandId[ChorusMessageCommandId["SetRateHz"] = 2] = "SetRateHz";
    ChorusMessageCommandId[ChorusMessageCommandId["SetMix"] = 3] = "SetMix";
    ChorusMessageCommandId[ChorusMessageCommandId["SetFeedback"] = 4] = "SetFeedback";
})(ChorusMessageCommandId || (ChorusMessageCommandId = {}));
export var SoftClipMessageCommandId;
(function (SoftClipMessageCommandId) {
    SoftClipMessageCommandId[SoftClipMessageCommandId["SetDrive"] = 0] = "SetDrive";
    SoftClipMessageCommandId[SoftClipMessageCommandId["SetGain"] = 1] = "SetGain";
})(SoftClipMessageCommandId || (SoftClipMessageCommandId = {}));
export var HardClipMessageCommandId;
(function (HardClipMessageCommandId) {
    HardClipMessageCommandId[HardClipMessageCommandId["SetDrive"] = 0] = "SetDrive";
    HardClipMessageCommandId[HardClipMessageCommandId["SetGain"] = 1] = "SetGain";
})(HardClipMessageCommandId || (HardClipMessageCommandId = {}));
export var AudioWorkletProcessorNames;
(function (AudioWorkletProcessorNames) {
    AudioWorkletProcessorNames["Compressor"] = "CompressorProcessor";
    AudioWorkletProcessorNames["MultibandCompressor"] = "MultibandCompressorProcessor";
    AudioWorkletProcessorNames["AdvancedDelay"] = "AdvancedDelayProcessor";
    AudioWorkletProcessorNames["MonoDelay"] = "MonoDelayProcessor";
    AudioWorkletProcessorNames["PingPongDelay"] = "PingPongDelayProcessor";
    AudioWorkletProcessorNames["StereoDelay"] = "StereoDelayProcessor";
    AudioWorkletProcessorNames["LowPassFilter"] = "LowPassFilterProcessor";
    AudioWorkletProcessorNames["HighPassFilter"] = "HighPassFilterProcessor";
    AudioWorkletProcessorNames["BandPassFilter"] = "BandPassFilterProcessor";
    AudioWorkletProcessorNames["NotchFilter"] = "NotchFilterProcessor";
    AudioWorkletProcessorNames["Chorus"] = "ChorusProcessor";
    AudioWorkletProcessorNames["Flanger"] = "FlangerProcessor";
    AudioWorkletProcessorNames["Phaser"] = "PhaserProcessor";
    AudioWorkletProcessorNames["Reverb"] = "ReverbProcessor";
    AudioWorkletProcessorNames["SoftClip"] = "SoftClipProcessor";
    AudioWorkletProcessorNames["HardClip"] = "HardClipProcessor";
    AudioWorkletProcessorNames["Equalizer"] = "EqualizerProcessor";
    AudioWorkletProcessorNames["Saturation"] = "SaturationProcessor";
})(AudioWorkletProcessorNames || (AudioWorkletProcessorNames = {}));
/**
 * Commands understood by the shared delay processor (MonoDelay, StereoDelay, PingPongDelay, AdvancedDelay).
 * Must match DelayEngineMessageCommandId in the worklet.
 */
export var AdvancedDelayMessageCommandId;
(function (AdvancedDelayMessageCommandId) {
    AdvancedDelayMessageCommandId[AdvancedDelayMessageCommandId["SetDelayLeftMs"] = 0] = "SetDelayLeftMs";
    AdvancedDelayMessageCommandId[AdvancedDelayMessageCommandId["SetDelayRightMs"] = 1] = "SetDelayRightMs";
    AdvancedDelayMessageCommandId[AdvancedDelayMessageCommandId["SetFeedback"] = 2] = "SetFeedback";
    AdvancedDelayMessageCommandId[AdvancedDelayMessageCommandId["SetCrossFeedback"] = 3] = "SetCrossFeedback";
    AdvancedDelayMessageCommandId[AdvancedDelayMessageCommandId["SetMix"] = 4] = "SetMix";
    AdvancedDelayMessageCommandId[AdvancedDelayMessageCommandId["SetLowCut"] = 5] = "SetLowCut";
    AdvancedDelayMessageCommandId[AdvancedDelayMessageCommandId["SetHighCut"] = 6] = "SetHighCut";
    AdvancedDelayMessageCommandId[AdvancedDelayMessageCommandId["SetModulationRate"] = 7] = "SetModulationRate";
    AdvancedDelayMessageCommandId[AdvancedDelayMessageCommandId["SetModulationDepth"] = 8] = "SetModulationDepth";
    AdvancedDelayMessageCommandId[AdvancedDelayMessageCommandId["SetDrive"] = 9] = "SetDrive";
})(AdvancedDelayMessageCommandId || (AdvancedDelayMessageCommandId = {}));
export var EqualizerMessageCommandId;
(function (EqualizerMessageCommandId) {
    EqualizerMessageCommandId[EqualizerMessageCommandId["SetBand"] = 0] = "SetBand";
    EqualizerMessageCommandId[EqualizerMessageCommandId["SetOutputGain"] = 1] = "SetOutputGain";
})(EqualizerMessageCommandId || (EqualizerMessageCommandId = {}));
export var SaturationMessageCommandId;
(function (SaturationMessageCommandId) {
    SaturationMessageCommandId[SaturationMessageCommandId["SetDrive"] = 0] = "SetDrive";
    SaturationMessageCommandId[SaturationMessageCommandId["SetMode"] = 1] = "SetMode";
    SaturationMessageCommandId[SaturationMessageCommandId["SetTone"] = 2] = "SetTone";
    SaturationMessageCommandId[SaturationMessageCommandId["SetMix"] = 3] = "SetMix";
    SaturationMessageCommandId[SaturationMessageCommandId["SetOutputGain"] = 4] = "SetOutputGain";
})(SaturationMessageCommandId || (SaturationMessageCommandId = {}));
export var ProcessorIdentificationCodes;
(function (ProcessorIdentificationCodes) {
    ProcessorIdentificationCodes["UnknownProcessorId"] = "UNKNOWN_PROCESSOR_ID";
    ProcessorIdentificationCodes["UnknownProcessorName"] = "UNKNOWN_PROCESSOR_NAME";
    ProcessorIdentificationCodes["UnknownProcessorCreationDate"] = "UNKNOWN_PROCESSOR_CREATION_DATE";
})(ProcessorIdentificationCodes || (ProcessorIdentificationCodes = {}));
export var StrictMode;
(function (StrictMode) {
    StrictMode[StrictMode["Disabled"] = 0] = "Disabled";
    StrictMode[StrictMode["Enabled"] = 1] = "Enabled";
})(StrictMode || (StrictMode = {}));
