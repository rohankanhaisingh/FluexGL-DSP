// ======== Audio worklet command id's ========
export var LowPassFilterMessageCommandId;
(function (LowPassFilterMessageCommandId) {
    LowPassFilterMessageCommandId[LowPassFilterMessageCommandId["SetCutoff"] = 0] = "SetCutoff";
    LowPassFilterMessageCommandId[LowPassFilterMessageCommandId["SetMinFrequency"] = 1] = "SetMinFrequency";
    LowPassFilterMessageCommandId[LowPassFilterMessageCommandId["SetQ"] = 2] = "SetQ";
})(LowPassFilterMessageCommandId || (LowPassFilterMessageCommandId = {}));
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
})(AudioWorkletProcessorNames || (AudioWorkletProcessorNames = {}));
