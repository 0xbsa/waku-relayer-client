import { Chain, RelayerConnectionStatus } from '@railgun-community/shared-models';
export declare class RelayerStatus {
    static getRelayerConnectionStatus(chain: Chain): RelayerConnectionStatus;
    private static hasRelayerFeesForNetwork;
    private static getAggregatedInfoForRelayers;
}
