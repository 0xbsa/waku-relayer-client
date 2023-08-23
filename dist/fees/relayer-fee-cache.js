import { networkForChain, } from '@railgun-community/shared-models';
import { AddressFilter } from '../filters/address-filter.js';
import { RelayerConfig } from '../models/relayer-config.js';
import { RelayerDebug } from '../utils/relayer-debug.js';
import { nameForRelayer, cachedFeeExpired, DEFAULT_RELAYER_IDENTIFIER, invalidRelayerVersion, cachedFeeUnavailableOrExpired, } from '../utils/relayer-util.js';
export class RelayerFeeCache {
    static addTokenFees(chain, railgunAddress, feeExpiration, tokenFeeMap, identifier, version) {
        var _a;
        const network = networkForChain(chain);
        if (!network) {
            return;
        }
        const relayerName = nameForRelayer(railgunAddress, identifier);
        const networkName = network.name;
        if (invalidRelayerVersion(version)) {
            RelayerDebug.log(`[Fees] Relayer version ${version} invalid (req ${RelayerConfig.MINIMUM_RELAYER_VERSION}-${RelayerConfig.MAXIMUM_RELAYER_VERSION}): ${relayerName}`);
            return;
        }
        if (cachedFeeExpired(feeExpiration)) {
            RelayerDebug.log(`[Fees] Fees expired for ${networkName} (${relayerName})`);
            return;
        }
        const tokenAddresses = Object.keys(tokenFeeMap);
        RelayerDebug.log(`[Fees] Updating fees for ${networkName} (${relayerName}): ${tokenAddresses.length} tokens`);
        (_a = this.cache.forNetwork)[networkName] ?? (_a[networkName] = { forToken: {} });
        const tokenAddressesLowercase = tokenAddresses.map(address => address.toLowerCase());
        tokenAddressesLowercase.forEach(tokenAddress => {
            var _a, _b;
            (_a = this.cache.forNetwork[networkName].forToken)[tokenAddress] ?? (_a[tokenAddress] = {
                forRelayer: {},
            });
            (_b = this.cache.forNetwork[networkName].forToken[tokenAddress].forRelayer)[railgunAddress] ?? (_b[railgunAddress] = { forIdentifier: {} });
            this.cache.forNetwork[networkName].forToken[tokenAddress].forRelayer[railgunAddress].forIdentifier[identifier ?? DEFAULT_RELAYER_IDENTIFIER] =
                tokenFeeMap[tokenAddress];
        });
    }
    static resetCache(chain) {
        var _a;
        const network = networkForChain(chain);
        if (!network) {
            return;
        }
        (_a = this.cache).forNetwork ?? (_a.forNetwork = {});
        delete this.cache.forNetwork[network.name];
    }
    static feesForChain(chain) {
        const network = networkForChain(chain);
        if (!network) {
            throw new Error('Chain not found.');
        }
        return this.cache.forNetwork[network.name];
    }
    static feesForToken(chain, tokenAddress) {
        return this.feesForChain(chain)?.forToken[tokenAddress.toLowerCase()];
    }
    static supportsToken(chain, tokenAddress, useRelayAdapt) {
        const feesForToken = this.feesForToken(chain, tokenAddress);
        if (!feesForToken) {
            return false;
        }
        const railgunAddresses = Object.keys(feesForToken.forRelayer);
        const filteredRailgunAddresses = AddressFilter.filter(railgunAddresses);
        const cachedFees = filteredRailgunAddresses
            .map(railgunAddress => Object.values(feesForToken.forRelayer[railgunAddress].forIdentifier))
            .flat();
        const availableUnexpiredFee = cachedFees.find(cachedFee => !cachedFeeUnavailableOrExpired(cachedFee, chain, useRelayAdapt));
        return availableUnexpiredFee != null;
    }
}
RelayerFeeCache.cache = { forNetwork: {} };
//# sourceMappingURL=relayer-fee-cache.js.map