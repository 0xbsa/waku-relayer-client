import { IMessage } from '@waku/interfaces';
export type WakuTransactResponse = {
    id: string;
    txHash?: string;
    error?: string;
};
export declare class RelayerTransactResponse {
    static storedTransactionResponse: Optional<WakuTransactResponse>;
    static sharedKey: Optional<Uint8Array>;
    static setSharedKey: (key: Uint8Array) => void;
    static clearSharedKey: () => void;
    static handleRelayerTransactionResponseMessage(message: IMessage): Promise<void>;
}
