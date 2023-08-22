"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelayerDebug = void 0;
class RelayerDebug {
    static setDebugger(debug) {
        this.debug = debug;
    }
    static log(msg) {
        if (this.debug) {
            this.debug.log(msg);
        }
    }
    static error(err, ignoreInTests = false) {
        if (this.debug) {
            this.debug.error(err);
        }
        if (process.env.NODE_ENV === 'test' && !ignoreInTests) {
            console.error(err);
        }
    }
}
exports.RelayerDebug = RelayerDebug;
//# sourceMappingURL=relayer-debug.js.map