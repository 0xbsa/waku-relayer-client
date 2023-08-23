import { RelayerDebugger } from '../models/export-models.js';
export declare class RelayerDebug {
    private static debug;
    static setDebugger(debug: RelayerDebugger): void;
    static log(msg: string): void;
    static error(err: Error, ignoreInTests?: boolean): void;
}
