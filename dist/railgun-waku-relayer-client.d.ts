import { Chain, SelectedRelayer } from '@railgun-community/shared-models';
import { RelayerConnectionStatusCallback, RelayerDebugger, RelayerOptions } from './models/export-models.js';
export declare class RailgunWakuRelayerClient {
    private static chain;
    private static statusCallback;
    private static started;
    private static isRestarting;
    static pollDelay: number;
    static start(chain: Chain, relayerOptions: RelayerOptions, statusCallback: RelayerConnectionStatusCallback, relayerDebugger?: RelayerDebugger): Promise<void>;
    static stop(): Promise<void>;
    static isStarted(): boolean;
    static setChain(chain: Chain): Promise<void>;
    static getContentTopics(): string[];
    static getMeshPeerCount(): number;
    static findBestRelayer(chain: Chain, tokenAddress: string, useRelayAdapt: boolean): Optional<SelectedRelayer>;
    static setAddressFilters(allowlist: Optional<string[]>, blocklist: Optional<string[]>): void;
    static tryReconnect(): Promise<void>;
    static supportsToken(chain: Chain, tokenAddress: string, useRelayAdapt: boolean): boolean;
    private static restart;
    private static pollStatus;
    private static updateStatus;
}
