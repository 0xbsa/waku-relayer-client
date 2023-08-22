"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cachedFeeUnavailableOrExpired = exports.invalidRelayerVersion = exports.cachedFeeExpired = exports.nameForRelayer = exports.shortenAddress = exports.DEFAULT_RELAYER_IDENTIFIER = void 0;
const shared_models_1 = require("@railgun-community/shared-models");
const relayer_config_1 = require("../models/relayer-config");
const is_defined_1 = require("./is-defined");
const FEE_EXPIRATION_MINIMUM_MSEC = 40000;
exports.DEFAULT_RELAYER_IDENTIFIER = 'default';
const shortenAddress = (address) => {
    if (address.length < 13) {
        return address;
    }
    return `${address.slice(0, 8)}...${address.slice(-4)}`;
};
exports.shortenAddress = shortenAddress;
const nameForRelayer = (railgunAddress, identifier) => {
    const shortAddress = (0, exports.shortenAddress)(railgunAddress);
    if ((0, is_defined_1.isDefined)(identifier)) {
        return `${shortAddress}: ${identifier}`;
    }
    return shortAddress;
};
exports.nameForRelayer = nameForRelayer;
const cachedFeeExpired = (feeExpiration) => {
    return feeExpiration < Date.now() + FEE_EXPIRATION_MINIMUM_MSEC;
};
exports.cachedFeeExpired = cachedFeeExpired;
const invalidRelayerVersion = (version) => {
    return ((0, shared_models_1.versionCompare)(version !== null && version !== void 0 ? version : '0.0.0', relayer_config_1.RelayerConfig.MINIMUM_RELAYER_VERSION) <
        0 ||
        (0, shared_models_1.versionCompare)(version !== null && version !== void 0 ? version : '0.0.0', relayer_config_1.RelayerConfig.MAXIMUM_RELAYER_VERSION) >
            0);
};
exports.invalidRelayerVersion = invalidRelayerVersion;
const cachedFeeUnavailableOrExpired = (cachedFee, chain, useRelayAdapt) => {
    if (useRelayAdapt) {
        const relayAdapt = cachedFee.relayAdapt;
        if (!relayAdapt) {
            return true;
        }
        const network = (0, shared_models_1.networkForChain)(chain);
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
    if ((0, exports.cachedFeeExpired)(cachedFee.expiration)) {
        return true;
    }
    return false;
};
exports.cachedFeeUnavailableOrExpired = cachedFeeUnavailableOrExpired;
//# sourceMappingURL=relayer-util.js.map