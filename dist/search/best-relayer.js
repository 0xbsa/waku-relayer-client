import { RelayerFeeCache } from '../fees/relayer-fee-cache.js';
import { AddressFilter } from '../filters/address-filter.js';
import { RelayerDebug } from '../utils/relayer-debug.js';
import { cachedFeeUnavailableOrExpired, shortenAddress, } from '../utils/relayer-util.js';
import { isDefined } from '../utils/is-defined.js';
export class RelayerSearch {
    static findBestRelayer(chain, tokenAddress, useRelayAdapt) {
        const tokenAddressLowercase = tokenAddress.toLowerCase();
        const relayerTokenFees = RelayerFeeCache.feesForChain(chain)?.forToken[tokenAddressLowercase]
            ?.forRelayer;
        if (!relayerTokenFees) {
            return undefined;
        }
        const unfilteredAddresses = Object.keys(relayerTokenFees);
        const relayerAddresses = AddressFilter.filter(unfilteredAddresses);
        if (unfilteredAddresses.length !== relayerAddresses.length) {
            const removedAddresses = unfilteredAddresses.filter(address => !relayerAddresses.includes(address));
            RelayerDebug.log(`Filtered RAILGUN relayer addresses ${removedAddresses.length}: ${removedAddresses
                .map(address => shortenAddress(address))
                .join(', ')}`);
        }
        let bestRelayerAddress;
        let bestRelayerIdentifier;
        let minFee;
        relayerAddresses.forEach((relayerAddress) => {
            const identifiers = Object.keys(relayerTokenFees[relayerAddress].forIdentifier);
            identifiers.forEach((identifier) => {
                const nextCachedFee = relayerTokenFees[relayerAddress].forIdentifier[identifier];
                if (cachedFeeUnavailableOrExpired(nextCachedFee, chain, useRelayAdapt)) {
                    return;
                }
                const fee = BigInt(nextCachedFee.feePerUnitGas);
                if (!isDefined(minFee) || fee < minFee) {
                    minFee = fee;
                    bestRelayerAddress = relayerAddress;
                    bestRelayerIdentifier = identifier;
                }
            });
        });
        if (!isDefined(bestRelayerAddress) || !isDefined(bestRelayerIdentifier)) {
            return undefined;
        }
        const selectedRelayer = {
            railgunAddress: bestRelayerAddress,
            tokenFee: relayerTokenFees[bestRelayerAddress].forIdentifier[bestRelayerIdentifier],
            tokenAddress,
        };
        return selectedRelayer;
    }
}
//# sourceMappingURL=best-relayer.js.map