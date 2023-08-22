import { Chain } from '@railgun-community/shared-models';
export declare class RelayerTransaction {
    private messageData;
    private contentTopic;
    private chain;
    private nullifiers;
    private constructor();
    static create(to: string, data: string, relayerRailgunAddress: string, relayerFeesID: string, chain: Chain, nullifiers: string[], overallBatchMinGasPrice: bigint, useRelayAdapt: boolean): Promise<RelayerTransaction>;
    private static encryptTransaction;
    private findMatchingNullifierTxid;
    private getTransactionResponse;
    private getRelayRetryState;
    send(): Promise<string>;
    private relay;
}
