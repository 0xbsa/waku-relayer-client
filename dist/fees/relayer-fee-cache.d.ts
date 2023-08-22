import { CachedTokenFee, Chain } from '@railgun-community/shared-models';
type RelayerFeeNetworkTokenRelayerCacheMap = {
    forIdentifier: MapType<CachedTokenFee>;
};
type RelayerFeeNetworkTokenCacheMap = {
    forRelayer: MapType<RelayerFeeNetworkTokenRelayerCacheMap>;
};
type RelayerFeeNetworkCacheMap = {
    forToken: MapType<RelayerFeeNetworkTokenCacheMap>;
};
export type RelayerFeeCacheState = {
    forNetwork: MapType<RelayerFeeNetworkCacheMap>;
};
export declare class RelayerFeeCache {
    private static cache;
    static addTokenFees(chain: Chain, railgunAddress: string, feeExpiration: number, tokenFeeMap: MapType<CachedTokenFee>, identifier: Optional<string>, version: string): void;
    static resetCache(chain: Chain): void;
    static feesForChain(chain: Chain): Optional<RelayerFeeNetworkCacheMap>;
    static feesForToken(chain: Chain, tokenAddress: string): Optional<RelayerFeeNetworkTokenCacheMap>;
    static supportsToken(chain: Chain, tokenAddress: string, useRelayAdapt: boolean): boolean;
}
export {};
