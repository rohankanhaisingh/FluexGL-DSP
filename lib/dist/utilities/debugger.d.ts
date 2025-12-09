import { ErrorCodes, WarningCodes } from "../console-codes";
export declare namespace Debug {
    function Log(message: string, additionalDetails?: string[]): void;
    function Success(message: string, additionalDetails?: string[]): void;
    function Warn(message: string, additionalDetails?: string[], warningCode?: WarningCodes): void;
    function Error(message: string, additionalDetails?: string[], errorCode?: ErrorCodes): void;
}
//# sourceMappingURL=debugger.d.ts.map