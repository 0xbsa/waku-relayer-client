import { verifyRelayerSignature, getRailgunWalletAddressData, } from '@railgun-community/wallet';
import crypto from 'crypto';
import { contentTopics } from '../waku/waku-topics.js';
import { RelayerDebug } from '../utils/relayer-debug.js';
import { RelayerConfig } from '../models/relayer-config.js';
import { RelayerFeeCache } from './relayer-fee-cache.js';
import { invalidRelayerVersion } from '../utils/relayer-util.js';
import { bytesToUtf8, hexToUTF8String } from '../utils/conversion.js';
import { isDefined } from '../utils/is-defined.js';
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
export const handleRelayerFeesMessage = async (chain, message, contentTopic) => {
    try {
        if (!isDefined(message.payload)) {
            return;
        }
        if (contentTopic !== contentTopics.fees(chain)) {
            return;
        }
        if (isExpiredTimestamp(message.timestamp)) {
            return;
        }
        const payload = bytesToUtf8(message.payload);
        const { data, signature } = JSON.parse(payload);
        const utf8String = hexToUTF8String(data);
        const feeMessageData = JSON.parse(utf8String);
        if (!isDefined(crypto.subtle) && RelayerConfig.IS_DEV) {
            RelayerDebug.log('Skipping Relayer fee validation in DEV. `crypto.subtle` does not exist (not secure: use https or localhost). ');
            updateFeesForRelayer(chain, feeMessageData);
            return;
        }
        if (invalidRelayerVersion(feeMessageData.version)) {
            RelayerDebug.log(`Skipping Relayer outside version range: ${feeMessageData.version}, ${feeMessageData.railgunAddress}`);
            return;
        }
        const { railgunAddress } = feeMessageData;
        const { viewingPublicKey } = getRailgunWalletAddressData(railgunAddress);
        const verified = await verifyRelayerSignature(signature, data, viewingPublicKey);
        if (!verified) {
            return;
        }
        updateFeesForRelayer(chain, feeMessageData);
    }
    catch (err) {
        if (!(err instanceof Error)) {
            throw err;
        }
        RelayerDebug.log('Error handling Relayer fees');
        const ignoreInTests = true;
        RelayerDebug.error(err, ignoreInTests);
    }
};
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
    RelayerFeeCache.addTokenFees(chain, feeMessageData.railgunAddress, feeMessageData.feeExpiration, tokenFeeMap, feeMessageData.identifier, feeMessageData.version);
};
//# sourceMappingURL=handle-fees-message.js.map