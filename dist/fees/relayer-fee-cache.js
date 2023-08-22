"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelayerFeeCache = void 0;
const shared_models_1 = require("@railgun-community/shared-models");
const address_filter_1 = require("../filters/address-filter");
const relayer_config_1 = require("../models/relayer-config");
const relayer_debug_1 = require("../utils/relayer-debug");
const relayer_util_1 = require("../utils/relayer-util");
class RelayerFeeCache {
    static addTokenFees(chain, railgunAddress, feeExpiration, tokenFeeMap, identifier, version) {
        var _a;
        var _b;
        const network = (0, shared_models_1.networkForChain)(chain);
        if (!network) {
            return;
        }
        const relayerName = (0, relayer_util_1.nameForRelayer)(railgunAddress, identifier);
        const networkName = network.name;
        if ((0, relayer_util_1.invalidRelayerVersion)(version)) {
            relayer_debug_1.RelayerDebug.log(`[Fees] Relayer version ${version} invalid (req ${relayer_config_1.RelayerConfig.MINIMUM_RELAYER_VERSION}-${relayer_config_1.RelayerConfig.MAXIMUM_RELAYER_VERSION}): ${relayerName}`);
            return;
        }
        if ((0, relayer_util_1.cachedFeeExpired)(feeExpiration)) {
            relayer_debug_1.RelayerDebug.log(`[Fees] Fees expired for ${networkName} (${relayerName})`);
            return;
        }
        const tokenAddresses = Object.keys(tokenFeeMap);
        relayer_debug_1.RelayerDebug.log(`[Fees] Updating fees for ${networkName} (${relayerName}): ${tokenAddresses.length} tokens`);
        (_a = (_b = this.cache.forNetwork)[networkName]) !== null && _a !== void 0 ? _a : (_b[networkName] = { forToken: {} });
        const tokenAddressesLowercase = tokenAddresses.map(address => address.toLowerCase());
        tokenAddressesLowercase.forEach(tokenAddress => {
            var _a, _b;
            var _c, _d;
            (_a = (_c = this.cache.forNetwork[networkName].forToken)[tokenAddress]) !== null && _a !== void 0 ? _a : (_c[tokenAddress] = {
                forRelayer: {},
            });
            (_b = (_d = this.cache.forNetwork[networkName].forToken[tokenAddress].forRelayer)[railgunAddress]) !== null && _b !== void 0 ? _b : (_d[railgunAddress] = { forIdentifier: {} });
            this.cache.forNetwork[networkName].forToken[tokenAddress].forRelayer[railgunAddress].forIdentifier[identifier !== null && identifier !== void 0 ? identifier : relayer_util_1.DEFAULT_RELAYER_IDENTIFIER] =
                tokenFeeMap[tokenAddress];
        });
    }
    static resetCache(chain) {
        var _a;
        var _b;
        const network = (0, shared_models_1.networkForChain)(chain);
        if (!network) {
            return;
        }
        (_a = (_b = this.cache).forNetwork) !== null && _a !== void 0 ? _a : (_b.forNetwork = {});
        delete this.cache.forNetwork[network.name];
    }
    static feesForChain(chain) {
        const network = (0, shared_models_1.networkForChain)(chain);
        if (!network) {
            throw new Error('Chain not found.');
        }
        return this.cache.forNetwork[network.name];
    }
    static feesForToken(chain, tokenAddress) {
        var _a;
        return (_a = this.feesForChain(chain)) === null || _a === void 0 ? void 0 : _a.forToken[tokenAddress.toLowerCase()];
    }
    static supportsToken(chain, tokenAddress, useRelayAdapt) {
        const feesForToken = this.feesForToken(chain, tokenAddress);
        if (!feesForToken) {
            return false;
        }
        const railgunAddresses = Object.keys(feesForToken.forRelayer);
        const filteredRailgunAddresses = address_filter_1.AddressFilter.filter(railgunAddresses);
        const cachedFees = filteredRailgunAddresses
            .map(railgunAddress => Object.values(feesForToken.forRelayer[railgunAddress].forIdentifier))
            .flat();
        const availableUnexpiredFee = cachedFees.find(cachedFee => !(0, relayer_util_1.cachedFeeUnavailableOrExpired)(cachedFee, chain, useRelayAdapt));
        return availableUnexpiredFee != null;
    }
}
exports.RelayerFeeCache = RelayerFeeCache;
RelayerFeeCache.cache = { forNetwork: {} };
//# sourceMappingURL=relayer-fee-cache.js.map