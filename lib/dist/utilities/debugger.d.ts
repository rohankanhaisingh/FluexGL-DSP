import { ErrorCodes, WarningCodes } from "../console-codes";
export declare namespace Debug {
    function log(message: string, additionalDetails?: string[]): void;
    function success(message: string, additionalDetails?: string[]): void;
    function warn(message: string, additionalDetails?: string[], warningCode?: WarningCodes): void;
    function error(message: string, additionalDetails?: string[], errorCode?: ErrorCodes): void;
}
//# sourceMappingURL=debugger.d.ts.map