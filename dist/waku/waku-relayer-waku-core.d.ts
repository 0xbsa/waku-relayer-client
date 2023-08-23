import { Chain } from '@railgun-community/shared-models';
import { RelayNode } from '@waku/interfaces';
import { RelayerOptions } from '../models/index.js';
export declare class WakuRelayerWakuCore {
    static hasError: boolean;
    static waku: Optional<RelayNode>;
    private static pubSubTopic;
    private static additionalDirectPeers;
    private static peerDiscoveryTimeout;
    static initWaku: (chain: Chain) => Promise<void>;
    static reinitWaku: (chain: Chain) => Promise<void>;
    static setRelayerOptions(relayerOptions: RelayerOptions): void;
    static disconnect: () => Promise<void>;
    private static connect;
    static getMeshPeerCount(): number;
    private static waitForRemotePeer;
    static relayMessage(data: object, contentTopic: string): Promise<void>;
}
