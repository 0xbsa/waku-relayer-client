import { getRailgunWalletAddressData, encryptDataWithSharedKey, getCompletedTxidFromNullifiers, } from '@railgun-community/wallet';
import { poll, } from '@railgun-community/shared-models';
import { RelayerConfig } from '../models/relayer-config.js';
import { bytesToHex } from '../utils/conversion.js';
import { RelayerDebug } from '../utils/relayer-debug.js';
import { isDefined } from '../utils/is-defined.js';
import { WakuRelayerWakuCore } from '../waku/waku-relayer-waku-core.js';
import { contentTopics } from '../waku/waku-topics.js';
import { RelayerTransactResponse, } from './relayer-transact-response.js';
import { getAddress, isHexString } from 'ethers';
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
export class RelayerTransaction {
    constructor(encryptedDataResponse, chain, nullifiers) {
        this.messageData = {
            method: 'transact',
            params: {
                pubkey: encryptedDataResponse.randomPubKey,
                encryptedData: encryptedDataResponse.encryptedData,
            },
        };
        this.contentTopic = contentTopics.transact(chain);
        this.chain = chain;
        this.nullifiers = nullifiers;
        RelayerTransactResponse.setSharedKey(encryptedDataResponse.sharedKey);
    }
    static async create(to, data, relayerRailgunAddress, relayerFeesID, chain, nullifiers, overallBatchMinGasPrice, useRelayAdapt) {
        const encryptedDataResponse = await this.encryptTransaction(to, data, relayerRailgunAddress, relayerFeesID, chain, overallBatchMinGasPrice, useRelayAdapt);
        return new RelayerTransaction(encryptedDataResponse, chain, nullifiers);
    }
    static async encryptTransaction(to, data, relayerRailgunAddress, relayerFeesID, chain, overallBatchMinGasPrice, useRelayAdapt) {
        if (!isHexString(data)) {
            throw new Error('Data field must be a hex string.');
        }
        const { viewingPublicKey: relayerViewingKey } = getRailgunWalletAddressData(relayerRailgunAddress);
        const transactData = {
            to: getAddress(to),
            data,
            relayerViewingKey: bytesToHex(relayerViewingKey),
            chainID: chain.id,
            chainType: chain.type,
            minGasPrice: overallBatchMinGasPrice.toString(),
            feesID: relayerFeesID,
            useRelayAdapt,
            devLog: RelayerConfig.IS_DEV,
            minVersion: RelayerConfig.MINIMUM_RELAYER_VERSION,
            maxVersion: RelayerConfig.MAXIMUM_RELAYER_VERSION,
        };
        const encryptedDataResponse = await encryptDataWithSharedKey(transactData, relayerViewingKey);
        return encryptedDataResponse;
    }
    async findMatchingNullifierTxid() {
        try {
            const { txid } = await getCompletedTxidFromNullifiers(this.chain, this.nullifiers);
            return txid;
        }
        catch (err) {
            if (!(err instanceof Error)) {
                throw err;
            }
            RelayerDebug.error(err);
            return undefined;
        }
    }
    async getTransactionResponse() {
        if (RelayerTransactResponse.storedTransactionResponse) {
            return RelayerTransactResponse.storedTransactionResponse;
        }
        const nullifiersTxid = await this.findMatchingNullifierTxid();
        if (isDefined(nullifiersTxid)) {
            return {
                id: 'nullifier-transaction',
                txHash: nullifiersTxid,
            };
        }
        return undefined;
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
    async send() {
        return this.relay();
    }
    async relay(retryNumber = 0) {
        const relayRetryState = this.getRelayRetryState(retryNumber);
        switch (relayRetryState) {
            case RelayRetryState.RetryTransact:
                RelayerDebug.log(`Relay Waku message: ${this.messageData.method} via ${this.contentTopic}`);
                await WakuRelayerWakuCore.relayMessage(this.messageData, this.contentTopic);
                break;
            case RelayRetryState.Wait:
                break;
            case RelayRetryState.Timeout:
                throw new Error('Request timed out.');
        }
        const pollIterations = SECONDS_PER_RETRY / POLL_DELAY_SECONDS;
        const response = await poll(async () => this.getTransactionResponse(), (result) => result != null, POLL_DELAY_SECONDS * 1000, pollIterations);
        if (isDefined(response)) {
            if (isDefined(response.txHash)) {
                RelayerTransactResponse.clearSharedKey();
                return response.txHash;
            }
            if (isDefined(response.error)) {
                RelayerTransactResponse.clearSharedKey();
                throw new Error(response.error);
            }
        }
        return this.relay(retryNumber + 1);
    }
}
//# sourceMappingURL=relayer-transaction.js.map