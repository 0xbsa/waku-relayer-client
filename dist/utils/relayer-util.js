import { networkForChain, versionCompare, } from '@railgun-community/shared-models';
import { RelayerConfig } from '../models/relayer-config.js';
import { isDefined } from './is-defined.js';
const FEE_EXPIRATION_MINIMUM_MSEC = 40000;
export const DEFAULT_RELAYER_IDENTIFIER = 'default';
export const shortenAddress = (address) => {
    if (address.length < 13) {
        return address;
    }
    return `${address.slice(0, 8)}...${address.slice(-4)}`;
};
export const nameForRelayer = (railgunAddress, identifier) => {
    const shortAddress = shortenAddress(railgunAddress);
    if (isDefined(identifier)) {
        return `${shortAddress}: ${identifier}`;
    }
    return shortAddress;
};
export const cachedFeeExpired = (feeExpiration) => {
    return feeExpiration < Date.now() + FEE_EXPIRATION_MINIMUM_MSEC;
};
export const invalidRelayerVersion = (version) => {
    return (versionCompare(version ?? '0.0.0', RelayerConfig.MINIMUM_RELAYER_VERSION) <
        0 ||
        versionCompare(version ?? '0.0.0', RelayerConfig.MAXIMUM_RELAYER_VERSION) >
            0);
};
export const cachedFeeUnavailableOrExpired = (cachedFee, chain, useRelayAdapt) => {
    if (useRelayAdapt) {
        const relayAdapt = cachedFee.relayAdapt;
        if (!relayAdapt) {
            return true;
        }
        const network = networkForChain(chain);
        if (!network) {
            throw new Error('Unrecognized chain');
        }
        const expectedRelayAdapt = network.relayAdaptContract;
        if (relayAdapt && relayAdapt !== expectedRelayAdapt) {
            return true;
        }
    }
    if (cachedFee.availableWallets === 0) {
        return true;
    }
    if (cachedFeeExpired(cachedFee.expiration)) {
        return true;
    }
    return false;
};
//# sourceMappingURL=relayer-util.js.map