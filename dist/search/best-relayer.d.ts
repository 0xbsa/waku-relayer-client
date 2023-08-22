import { Chain, SelectedRelayer } from '@railgun-community/shared-models';
export declare class RelayerSearch {
    static findBestRelayer(chain: Chain, tokenAddress: string, useRelayAdapt: boolean): Optional<SelectedRelayer>;
}
