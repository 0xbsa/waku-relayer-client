var _a;
import { compareChains } from '@railgun-community/shared-models';
import { createDecoder } from '@waku/core';
import { contentTopics } from './waku-topics.js';
import { handleRelayerFeesMessage } from '../fees/handle-fees-message.js';
import { RelayerTransactResponse } from '../transact/relayer-transact-response.js';
import { RelayerDebug } from '../utils/relayer-debug.js';
import { isDefined } from '../utils/is-defined.js';
export class WakuObservers {
    static getCurrentContentTopics(waku) {
        const observers = waku?.relay?.observers;
        const contentTopics = [];
        for (const observer of observers.keys()) {
            contentTopics.push(observer);
        }
        return contentTopics;
    }
}
_a = WakuObservers;
WakuObservers.setObserversForChain = async (waku, chain) => {
    if (!waku) {
        return;
    }
    if (WakuObservers.currentChain &&
        compareChains(WakuObservers.currentChain, chain)) {
        return;
    }
    RelayerDebug.log(`Add Waku observers for chain: ${chain.type}:${chain.id}`);
    WakuObservers.currentChain = chain;
    WakuObservers.removeAllObservers(waku);
    await WakuObservers.addChainObservers(waku, chain);
    RelayerDebug.log(`Waku listening for events on chain: ${chain.type}:${chain.id}`);
};
WakuObservers.resetCurrentChain = () => {
    _a.currentChain = undefined;
};
WakuObservers.removeAllObservers = (waku) => {
    if (!isDefined(waku.relay)) {
        return;
    }
    waku.relay.observers = new Map();
};
WakuObservers.addChainObservers = async (waku, chain) => {
    if (!isDefined(waku.relay)) {
        return;
    }
    const contentTopicFees = contentTopics.fees(chain);
    await waku.relay.subscribe(createDecoder(contentTopicFees), (message) => handleRelayerFeesMessage(chain, message, contentTopicFees));
    await waku.relay.subscribe(createDecoder(contentTopics.transactResponse(chain)), RelayerTransactResponse.handleRelayerTransactionResponseMessage);
    const currentContentTopics = WakuObservers.getCurrentContentTopics(waku);
    RelayerDebug.log('Waku content topics:');
    for (const observer of currentContentTopics) {
        RelayerDebug.log(observer);
    }
};
//# sourceMappingURL=waku-observers.js.map