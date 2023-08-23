var _a;
import { promiseTimeout } from '@railgun-community/shared-models';
import { waitForRemotePeer, createEncoder } from '@waku/core';
import { Protocols } from '@waku/interfaces';
import { WakuObservers } from './waku-observers.js';
import { RelayerDebug } from '../utils/relayer-debug.js';
import { RelayerFeeCache } from '../fees/relayer-fee-cache.js';
import { utf8ToBytes } from '../utils/conversion.js';
import { isDefined } from '../utils/is-defined.js';
import { bootstrap } from '@libp2p/bootstrap';
import { createRelayNode } from '@waku/create';
import { WAKU_RAILGUN_DEFAULT_PEERS, WAKU_RAILGUN_PUB_SUB_TOPIC, } from '../models/constants.js';
export class WakuRelayerWakuCore {
    static setRelayerOptions(relayerOptions) {
        if (isDefined(relayerOptions.pubSubTopic)) {
            WakuRelayerWakuCore.pubSubTopic = relayerOptions.pubSubTopic;
        }
        if (relayerOptions.additionalDirectPeers) {
            WakuRelayerWakuCore.additionalDirectPeers =
                relayerOptions.additionalDirectPeers;
        }
        if (isDefined(relayerOptions.peerDiscoveryTimeout)) {
            WakuRelayerWakuCore.peerDiscoveryTimeout =
                relayerOptions.peerDiscoveryTimeout;
        }
    }
    static getMeshPeerCount() {
        return this.waku?.relay.getMeshPeers().length ?? 0;
    }
    static async waitForRemotePeer(waku) {
        try {
            const protocols = [Protocols.Relay];
            await promiseTimeout(waitForRemotePeer(waku, protocols), WakuRelayerWakuCore.peerDiscoveryTimeout);
        }
        catch (err) {
            if (!(err instanceof Error)) {
                throw err;
            }
            RelayerDebug.error(err);
            throw new Error(err.message);
        }
    }
    static async relayMessage(data, contentTopic) {
        if (!WakuRelayerWakuCore.waku?.relay) {
            throw new Error('No Waku Relay found.');
        }
        const dataString = JSON.stringify(data);
        const payload = utf8ToBytes(dataString);
        const message = { payload };
        try {
            await WakuRelayerWakuCore.waku.relay.send(createEncoder({ contentTopic }), message);
        }
        catch (err) {
            if (!(err instanceof Error)) {
                throw err;
            }
            RelayerDebug.error(err);
        }
    }
}
_a = WakuRelayerWakuCore;
WakuRelayerWakuCore.hasError = false;
WakuRelayerWakuCore.pubSubTopic = WAKU_RAILGUN_PUB_SUB_TOPIC;
WakuRelayerWakuCore.additionalDirectPeers = [];
WakuRelayerWakuCore.peerDiscoveryTimeout = 60000;
WakuRelayerWakuCore.initWaku = async (chain) => {
    try {
        await WakuRelayerWakuCore.connect();
        if (!WakuRelayerWakuCore.waku) {
            RelayerDebug.log('No waku instance found');
            return;
        }
        WakuObservers.resetCurrentChain();
        await WakuObservers.setObserversForChain(WakuRelayerWakuCore.waku, chain);
    }
    catch (err) {
        if (!(err instanceof Error)) {
            throw err;
        }
        RelayerDebug.error(err);
        throw err;
    }
};
WakuRelayerWakuCore.reinitWaku = async (chain) => {
    if (isDefined(WakuRelayerWakuCore.waku) &&
        WakuRelayerWakuCore.waku.isStarted()) {
        await WakuRelayerWakuCore.disconnect();
    }
    RelayerFeeCache.resetCache(chain);
    await WakuRelayerWakuCore.initWaku(chain);
};
WakuRelayerWakuCore.disconnect = async () => {
    await WakuRelayerWakuCore.waku?.stop();
    WakuRelayerWakuCore.waku = undefined;
};
WakuRelayerWakuCore.connect = async () => {
    try {
        WakuRelayerWakuCore.hasError = false;
        RelayerDebug.log(`Creating waku relay client`);
        const peers = [
            ...WAKU_RAILGUN_DEFAULT_PEERS,
            ..._a.additionalDirectPeers,
        ];
        const waitTimeoutBeforeBootstrap = 250;
        const waku = await createRelayNode({
            pubSubTopic: WakuRelayerWakuCore.pubSubTopic,
            libp2p: {
                peerDiscovery: [
                    bootstrap({
                        list: peers,
                        timeout: waitTimeoutBeforeBootstrap,
                    }),
                ],
            },
        });
        RelayerDebug.log('Start Waku.');
        await waku.start();
        RelayerDebug.log('Waiting for remote peer.');
        await _a.waitForRemotePeer(waku);
        if (!isDefined(waku.relay)) {
            throw new Error('No Waku Relay instantiated.');
        }
        RelayerDebug.log('Waku peers:');
        for (const peer of waku.relay.getMeshPeers()) {
            RelayerDebug.log(JSON.stringify(peer));
        }
        RelayerDebug.log('Connected to Waku');
        WakuRelayerWakuCore.waku = waku;
        WakuRelayerWakuCore.hasError = false;
    }
    catch (err) {
        if (!(err instanceof Error)) {
            throw err;
        }
        WakuRelayerWakuCore.hasError = true;
        throw err;
    }
};
//# sourceMappingURL=waku-relayer-waku-core.js.map