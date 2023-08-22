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
exports.RelayerTransaction = void 0;
const wallet_1 = require("@railgun-community/wallet");
const shared_models_1 = require("@railgun-community/shared-models");
const relayer_config_1 = require("../models/relayer-config");
const conversion_1 = require("../utils/conversion");
const relayer_debug_1 = require("../utils/relayer-debug");
const is_defined_1 = require("../utils/is-defined");
const waku_relayer_waku_core_1 = require("../waku/waku-relayer-waku-core");
const waku_topics_1 = require("../waku/waku-topics");
const relayer_transact_response_1 = require("./relayer-transact-response");
const ethers_1 = require("ethers");
var RelayRetryState;
(function (RelayRetryState) {
    RelayRetryState["RetryTransact"] = "RetryTransact";
    RelayRetryState["Wait"] = "Wait";
    RelayRetryState["Timeout"] = "Timeout";
})(RelayRetryState || (RelayRetryState = {}));
const SECONDS_PER_RETRY = 1.5;
const POLL_DELAY_SECONDS = 0.1;
const RETRY_TRANSACTION_SECONDS = 15;
const POST_ALERT_TOTAL_WAITING_SECONDS = 60;
class RelayerTransaction {
    constructor(encryptedDataResponse, chain, nullifiers) {
        this.messageData = {
            method: 'transact',
            params: {
                pubkey: encryptedDataResponse.randomPubKey,
                encryptedData: encryptedDataResponse.encryptedData,
            },
        };
        this.contentTopic = waku_topics_1.contentTopics.transact(chain);
        this.chain = chain;
        this.nullifiers = nullifiers;
        relayer_transact_response_1.RelayerTransactResponse.setSharedKey(encryptedDataResponse.sharedKey);
    }
    static create(to, data, relayerRailgunAddress, relayerFeesID, chain, nullifiers, overallBatchMinGasPrice, useRelayAdapt) {
        return __awaiter(this, void 0, void 0, function* () {
            const encryptedDataResponse = yield this.encryptTransaction(to, data, relayerRailgunAddress, relayerFeesID, chain, overallBatchMinGasPrice, useRelayAdapt);
            return new RelayerTransaction(encryptedDataResponse, chain, nullifiers);
        });
    }
    static encryptTransaction(to, data, relayerRailgunAddress, relayerFeesID, chain, overallBatchMinGasPrice, useRelayAdapt) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(0, ethers_1.isHexString)(data)) {
                throw new Error('Data field must be a hex string.');
            }
            const { viewingPublicKey: relayerViewingKey } = (0, wallet_1.getRailgunWalletAddressData)(relayerRailgunAddress);
            const transactData = {
                to: (0, ethers_1.getAddress)(to),
                data,
                relayerViewingKey: (0, conversion_1.bytesToHex)(relayerViewingKey),
                chainID: chain.id,
                chainType: chain.type,
                minGasPrice: overallBatchMinGasPrice.toString(),
                feesID: relayerFeesID,
                useRelayAdapt,
                devLog: relayer_config_1.RelayerConfig.IS_DEV,
                minVersion: relayer_config_1.RelayerConfig.MINIMUM_RELAYER_VERSION,
                maxVersion: relayer_config_1.RelayerConfig.MAXIMUM_RELAYER_VERSION,
            };
            const encryptedDataResponse = yield (0, wallet_1.encryptDataWithSharedKey)(transactData, relayerViewingKey);
            return encryptedDataResponse;
        });
    }
    findMatchingNullifierTxid() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { txid } = yield (0, wallet_1.getCompletedTxidFromNullifiers)(this.chain, this.nullifiers);
                return txid;
            }
            catch (err) {
                if (!(err instanceof Error)) {
                    throw err;
                }
                relayer_debug_1.RelayerDebug.error(err);
                return undefined;
            }
        });
    }
    getTransactionResponse() {
        return __awaiter(this, void 0, void 0, function* () {
            if (relayer_transact_response_1.RelayerTransactResponse.storedTransactionResponse) {
                return relayer_transact_response_1.RelayerTransactResponse.storedTransactionResponse;
            }
            const nullifiersTxid = yield this.findMatchingNullifierTxid();
            if ((0, is_defined_1.isDefined)(nullifiersTxid)) {
                return {
                    id: 'nullifier-transaction',
                    txHash: nullifiersTxid,
                };
            }
            return undefined;
        });
    }
    getRelayRetryState(retryNumber) {
        const retrySeconds = retryNumber * SECONDS_PER_RETRY;
        if (retrySeconds <= RETRY_TRANSACTION_SECONDS) {
            return RelayRetryState.RetryTransact;
        }
        if (retrySeconds >= POST_ALERT_TOTAL_WAITING_SECONDS) {
            return RelayRetryState.Timeout;
        }
        return RelayRetryState.Wait;
    }
    send() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.relay();
        });
    }
    relay(retryNumber = 0) {
        return __awaiter(this, void 0, void 0, function* () {
            const relayRetryState = this.getRelayRetryState(retryNumber);
            switch (relayRetryState) {
                case RelayRetryState.RetryTransact:
                    relayer_debug_1.RelayerDebug.log(`Relay Waku message: ${this.messageData.method} via ${this.contentTopic}`);
                    yield waku_relayer_waku_core_1.WakuRelayerWakuCore.relayMessage(this.messageData, this.contentTopic);
                    break;
                case RelayRetryState.Wait:
                    break;
                case RelayRetryState.Timeout:
                    throw new Error('Request timed out.');
            }
            const pollIterations = SECONDS_PER_RETRY / POLL_DELAY_SECONDS;
            const response = yield (0, shared_models_1.poll)(() => __awaiter(this, void 0, void 0, function* () { return this.getTransactionResponse(); }), (result) => result != null, POLL_DELAY_SECONDS * 1000, pollIterations);
            if ((0, is_defined_1.isDefined)(response)) {
                if ((0, is_defined_1.isDefined)(response.txHash)) {
                    relayer_transact_response_1.RelayerTransactResponse.clearSharedKey();
                    return response.txHash;
                }
                if ((0, is_defined_1.isDefined)(response.error)) {
                    relayer_transact_response_1.RelayerTransactResponse.clearSharedKey();
                    throw new Error(response.error);
                }
            }
            return this.relay(retryNumber + 1);
        });
    }
}
exports.RelayerTransaction = RelayerTransaction;
//# sourceMappingURL=relayer-transaction.js.map