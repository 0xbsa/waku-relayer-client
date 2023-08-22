"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelayerSearch = void 0;
const relayer_fee_cache_1 = require("../fees/relayer-fee-cache");
const address_filter_1 = require("../filters/address-filter");
const relayer_debug_1 = require("../utils/relayer-debug");
const relayer_util_1 = require("../utils/relayer-util");
const is_defined_1 = require("../utils/is-defined");
class RelayerSearch {
    static findBestRelayer(chain, tokenAddress, useRelayAdapt) {
        var _a, _b;
        const tokenAddressLowercase = tokenAddress.toLowerCase();
        const relayerTokenFees = (_b = (_a = relayer_fee_cache_1.RelayerFeeCache.feesForChain(chain)) === null || _a === void 0 ? void 0 : _a.forToken[tokenAddressLowercase]) === null || _b === void 0 ? void 0 : _b.forRelayer;
        if (!relayerTokenFees) {
            return undefined;
        }
        const unfilteredAddresses = Object.keys(relayerTokenFees);
        const relayerAddresses = address_filter_1.AddressFilter.filter(unfilteredAddresses);
        if (unfilteredAddresses.length !== relayerAddresses.length) {
            const removedAddresses = unfilteredAddresses.filter(address => !relayerAddresses.includes(address));
            relayer_debug_1.RelayerDebug.log(`Filtered RAILGUN relayer addresses ${removedAddresses.length}: ${removedAddresses
                .map(address => (0, relayer_util_1.shortenAddress)(address))
                .join(', ')}`);
        }
        let bestRelayerAddress;
        let bestRelayerIdentifier;
        let minFee;
        relayerAddresses.forEach((relayerAddress) => {
            const identifiers = Object.keys(relayerTokenFees[relayerAddress].forIdentifier);
            identifiers.forEach((identifier) => {
                const nextCachedFee = relayerTokenFees[relayerAddress].forIdentifier[identifier];
                if ((0, relayer_util_1.cachedFeeUnavailableOrExpired)(nextCachedFee, chain, useRelayAdapt)) {
                    return;
                }
                const fee = BigInt(nextCachedFee.feePerUnitGas);
                if (!(0, is_defined_1.isDefined)(minFee) || fee < minFee) {
                    minFee = fee;
                    bestRelayerAddress = relayerAddress;
                    bestRelayerIdentifier = identifier;
                }
            });
        });
        if (!(0, is_defined_1.isDefined)(bestRelayerAddress) || !(0, is_defined_1.isDefined)(bestRelayerIdentifier)) {
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
exports.RelayerSearch = RelayerSearch;
//# sourceMappingURL=best-relayer.js.map