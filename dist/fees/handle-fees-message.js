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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleRelayerFeesMessage = void 0;
const wallet_1 = require("@railgun-community/wallet");
const crypto_1 = __importDefault(require("crypto"));
const waku_topics_1 = require("../waku/waku-topics");
const relayer_debug_1 = require("../utils/relayer-debug");
const relayer_config_1 = require("../models/relayer-config");
const relayer_fee_cache_1 = require("./relayer-fee-cache");
const relayer_util_1 = require("../utils/relayer-util");
const conversion_1 = require("../utils/conversion");
const is_defined_1 = require("../utils/is-defined");
const isExpiredTimestamp = (timestamp) => {
    if (!timestamp) {
        return false;
    }
    if (timestamp.getFullYear() === 1970) {
        return false;
    }
    const expirationMsec = Date.now() - 45 * 1000;
    return timestamp.getTime() < expirationMsec;
};
const handleRelayerFeesMessage = (chain, message, contentTopic) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!(0, is_defined_1.isDefined)(message.payload)) {
            return;
        }
        if (contentTopic !== waku_topics_1.contentTopics.fees(chain)) {
            return;
        }
        if (isExpiredTimestamp(message.timestamp)) {
            return;
        }
        const payload = (0, conversion_1.bytesToUtf8)(message.payload);
        const { data, signature } = JSON.parse(payload);
        const utf8String = (0, conversion_1.hexToUTF8String)(data);
        const feeMessageData = JSON.parse(utf8String);
        if (!(0, is_defined_1.isDefined)(crypto_1.default.subtle) && relayer_config_1.RelayerConfig.IS_DEV) {
            relayer_debug_1.RelayerDebug.log('Skipping Relayer fee validation in DEV. `crypto.subtle` does not exist (not secure: use https or localhost). ');
            updateFeesForRelayer(chain, feeMessageData);
            return;
        }
        if ((0, relayer_util_1.invalidRelayerVersion)(feeMessageData.version)) {
            relayer_debug_1.RelayerDebug.log(`Skipping Relayer outside version range: ${feeMessageData.version}, ${feeMessageData.railgunAddress}`);
            return;
        }
        const { railgunAddress } = feeMessageData;
        const { viewingPublicKey } = (0, wallet_1.getRailgunWalletAddressData)(railgunAddress);
        const verified = yield (0, wallet_1.verifyRelayerSignature)(signature, data, viewingPublicKey);
        if (!verified) {
            return;
        }
        updateFeesForRelayer(chain, feeMessageData);
    }
    catch (err) {
        if (!(err instanceof Error)) {
            throw err;
        }
        relayer_debug_1.RelayerDebug.log('Error handling Relayer fees');
        const ignoreInTests = true;
        relayer_debug_1.RelayerDebug.error(err, ignoreInTests);
    }
});
exports.handleRelayerFeesMessage = handleRelayerFeesMessage;
const updateFeesForRelayer = (chain, feeMessageData) => {
    const tokenFeeMap = {};
    const tokenAddresses = Object.keys(feeMessageData.fees);
    tokenAddresses.forEach(tokenAddress => {
        const feePerUnitGas = feeMessageData.fees[tokenAddress];
        if (feePerUnitGas) {
            const cachedFee = {
                feePerUnitGas,
                expiration: feeMessageData.feeExpiration,
                feesID: feeMessageData.feesID,
                availableWallets: feeMessageData.availableWallets,
                relayAdapt: feeMessageData.relayAdapt,
            };
            tokenFeeMap[tokenAddress] = cachedFee;
        }
    });
    relayer_fee_cache_1.RelayerFeeCache.addTokenFees(chain, feeMessageData.railgunAddress, feeMessageData.feeExpiration, tokenFeeMap, feeMessageData.identifier, feeMessageData.version);
};
//# sourceMappingURL=handle-fees-message.js.map