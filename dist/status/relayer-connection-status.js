"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelayerStatus = void 0;
const shared_models_1 = require("@railgun-community/shared-models");
const relayer_fee_cache_1 = require("../fees/relayer-fee-cache");
const address_filter_1 = require("../filters/address-filter");
const relayer_util_1 = require("../utils/relayer-util");
const waku_relayer_waku_core_1 = require("../waku/waku-relayer-waku-core");
const is_defined_1 = require("../utils/is-defined");
class RelayerStatus {
    static getRelayerConnectionStatus(chain) {
        if (waku_relayer_waku_core_1.WakuRelayerWakuCore.hasError) {
            return shared_models_1.RelayerConnectionStatus.Error;
        }
        if (!waku_relayer_waku_core_1.WakuRelayerWakuCore.waku) {
            return shared_models_1.RelayerConnectionStatus.Disconnected;
        }
        if (!this.hasRelayerFeesForNetwork(chain)) {
            return shared_models_1.RelayerConnectionStatus.Searching;
        }
        const { allRelayerFeesExpired, anyRelayersAvailable } = this.getAggregatedInfoForRelayers(chain);
        if (allRelayerFeesExpired) {
            return shared_models_1.RelayerConnectionStatus.Disconnected;
        }
        if (!anyRelayersAvailable) {
            return shared_models_1.RelayerConnectionStatus.AllUnavailable;
        }
        return shared_models_1.RelayerConnectionStatus.Connected;
    }
    static hasRelayerFeesForNetwork(chain) {
        const relayerFees = relayer_fee_cache_1.RelayerFeeCache.feesForChain(chain);
        if (!(0, is_defined_1.isDefined)(relayerFees) || !(0, is_defined_1.isDefined)(relayerFees.forToken)) {
            return false;
        }
        const cachedTokenRelayers = Object.values(relayerFees.forToken);
        return (cachedTokenRelayers.find(tokenRelayerMap => {
            const unfilteredRelayerAddresses = Object.keys(tokenRelayerMap.forRelayer);
            const filteredRelayerAddresses = address_filter_1.AddressFilter.filter(unfilteredRelayerAddresses);
            return filteredRelayerAddresses.length > 0;
        }) != null);
    }
    static getAggregatedInfoForRelayers(chain) {
        const relayerFees = relayer_fee_cache_1.RelayerFeeCache.feesForChain(chain);
        if (!(0, is_defined_1.isDefined)(relayerFees) || !(0, is_defined_1.isDefined)(relayerFees.forToken)) {
            return { allRelayerFeesExpired: false, anyRelayersAvailable: false };
        }
        const cachedTokenRelayers = Object.values(relayerFees.forToken);
        let allRelayerFeesExpired = true;
        let anyRelayersAvailable = false;
        cachedTokenRelayers.forEach(tokenRelayerMap => {
            const unfilteredRailgunAddresses = Object.keys(tokenRelayerMap.forRelayer);
            const filteredRailgunAddresses = address_filter_1.AddressFilter.filter(unfilteredRailgunAddresses);
            filteredRailgunAddresses.forEach(railgunAddress => {
                const identifiers = Object.keys(tokenRelayerMap.forRelayer[railgunAddress].forIdentifier);
                identifiers.every(identifier => {
                    const tokenFee = tokenRelayerMap.forRelayer[railgunAddress].forIdentifier[identifier];
                    if ((0, relayer_util_1.cachedFeeExpired)(tokenFee.expiration)) {
                        return true;
                    }
                    allRelayerFeesExpired = false;
                    if (tokenFee.availableWallets > 0) {
                        anyRelayersAvailable = true;
                        return false;
                    }
                    return true;
                });
            });
        });
        return { allRelayerFeesExpired, anyRelayersAvailable };
    }
}
exports.RelayerStatus = RelayerStatus;
//# sourceMappingURL=relayer-connection-status.js.map