import { DSP } from "../index";
export var Debug;
(function (Debug) {
    function log(message, additionalDetails) {
        if (!DSP.debugger.showInfo)
            return;
        let outputString = `%c[INFO]: %c${message} %c`;
        additionalDetails && additionalDetails.forEach(function (detail) {
            outputString += `\n\u0009  > ${detail}`;
        });
        return console.log(outputString, "color: white;", "color: gray", "color: gray");
    }
    Debug.log = log;
    function success(message, additionalDetails) {
        if (!DSP.debugger.showInfo)
            return;
        let outputString = `%c[SUCCESS]: %c${message} %c`;
        additionalDetails && additionalDetails.forEach(function (detail) {
            outputString += `\n\u0009  > ${detail}`;
        });
        return console.log(outputString, "color: lime;", "color: white", "color: gray");
    }
    Debug.success = success;
    function warn(message, additionalDetails, warningCode) {
        if (!DSP.debugger.showWarnings)
            return;
        let outputString = `%c(${warningCode ? warningCode : "Unknown".toUpperCase()}) %c[WARNING]: %c${message} %c`;
        (additionalDetails && additionalDetails !== null) && additionalDetails.forEach(function (detail) {
            outputString += `\n\u0009  > ${detail}`;
        });
        return console.log(outputString, "color: gray", "color: yellow;", "color: white", "color: white; font-style: italic;");
    }
    Debug.warn = warn;
    function error(message, additionalDetails, errorCode) {
        if (!DSP.debugger.showErrors)
            return;
        let outputString = `%c(${errorCode ? errorCode : "Unknown".toUpperCase()}) %c[ERROR]: %c${message} %c`;
        (additionalDetails && additionalDetails !== null) && additionalDetails.forEach(function (detail) {
            outputString += `\n\u0009  > ${detail}`;
        });
        console.log(outputString, "color: red", "color: red;", "color: white", "color: white; font-style: italic;");
        if (DSP.debugger.breakOnError) {
            for (let char of message)
                outputString = outputString.replace("%c", "");
            throw new window.Error(outputString);
        }
    }
    Debug.error = error;
})(Debug || (Debug = {}));
