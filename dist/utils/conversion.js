"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.utf8ToBytes = exports.bytesToHex = exports.bytesToUtf8 = exports.hexToUTF8String = void 0;
const hexToUTF8String = (hexData) => {
    const buffer = Buffer.from(hexData, 'hex');
    return new TextDecoder().decode(buffer);
};
exports.hexToUTF8String = hexToUTF8String;
const bytesToUtf8 = (bytes) => {
    return Buffer.from(bytes).toString('utf8');
};
exports.bytesToUtf8 = bytesToUtf8;
const bytesToHex = (bytes) => {
    return Buffer.from(bytes).toString('hex');
};
exports.bytesToHex = bytesToHex;
const utf8ToBytes = (utf8) => {
    return Buffer.from(utf8, 'utf8');
};
exports.utf8ToBytes = utf8ToBytes;
//# sourceMappingURL=conversion.js.map