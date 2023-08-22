"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelayerTransactResponse = void 0;
const wallet_1 = require("@railgun-community/wallet");
const conversion_1 = require("../utils/conversion");
const relayer_debug_1 = require("../utils/relayer-debug");
const is_defined_1 = require("../utils/is-defined");
class RelayerTransactResponse {
    static handleRelayerTransactionResponseMessage(message) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!RelayerTransactResponse.sharedKey) {
                return;
            }
            if (!(0, is_defined_1.isDefined)(message.payload)) {
                return;
            }
            try {
                const payload = (0, conversion_1.bytesToUtf8)(message.payload);
                const { result: encryptedData } = JSON.parse(payload);
                const decrypted = (0, wallet_1.decryptAESGCM256)(encryptedData, RelayerTransactResponse.sharedKey);
                if (decrypted == null) {
                    return;
                }
                relayer_debug_1.RelayerDebug.log('Handle Relayer transact-response message:');
                relayer_debug_1.RelayerDebug.log(JSON.stringify(decrypted));
                RelayerTransactResponse.storedTransactionResponse =
                    decrypted;
            }
            catch (err) {
                if (!(err instanceof Error)) {
                    throw err;
                }
                relayer_debug_1.RelayerDebug.log(`Could not handle Relayer tx response message`);
                relayer_debug_1.RelayerDebug.error(err);
            }
        });
    }
}
exports.RelayerTransactResponse = RelayerTransactResponse;
RelayerTransactResponse.setSharedKey = (key) => {
    RelayerTransactResponse.sharedKey = key;
    RelayerTransactResponse.storedTransactionResponse = undefined;
};
RelayerTransactResponse.clearSharedKey = () => {
    RelayerTransactResponse.sharedKey = undefined;
    RelayerTransactResponse.storedTransactionResponse = undefined;
};
//# sourceMappingURL=relayer-transact-response.js.map