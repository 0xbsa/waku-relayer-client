"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WakuObservers = void 0;
const shared_models_1 = require("@railgun-community/shared-models");
const core_1 = require("@waku/core");
const waku_topics_1 = require("./waku-topics");
const handle_fees_message_1 = require("../fees/handle-fees-message");
const relayer_transact_response_1 = require("../transact/relayer-transact-response");
const relayer_debug_1 = require("../utils/relayer-debug");
const is_defined_1 = require("../utils/is-defined");
class WakuObservers {
    static getCurrentContentTopics(waku) {
        var _b;
        const observers = (_b = waku === null || waku === void 0 ? void 0 : waku.relay) === null || _b === void 0 ? void 0 : _b.observers;
        const contentTopics = [];
        for (const observer of observers.keys()) {
            contentTopics.push(observer);
        }
        return contentTopics;
    }
}
exports.WakuObservers = WakuObservers;
_a = WakuObservers;
WakuObservers.setObserversForChain = (waku, chain) => __awaiter(void 0, void 0, void 0, function* () {
    if (!waku) {
        return;
    }
    if (WakuObservers.currentChain &&
        (0, shared_models_1.compareChains)(WakuObservers.currentChain, chain)) {
        return;
    }
    relayer_debug_1.RelayerDebug.log(`Add Waku observers for chain: ${chain.type}:${chain.id}`);
    WakuObservers.currentChain = chain;
    WakuObservers.removeAllObservers(waku);
    yield WakuObservers.addChainObservers(waku, chain);
    relayer_debug_1.RelayerDebug.log(`Waku listening for events on chain: ${chain.type}:${chain.id}`);
});
WakuObservers.resetCurrentChain = () => {
    _a.currentChain = undefined;
};
WakuObservers.removeAllObservers = (waku) => {
    if (!(0, is_defined_1.isDefined)(waku.relay)) {
        return;
    }
    waku.relay.observers = new Map();
};
WakuObservers.addChainObservers = (waku, chain) => __awaiter(void 0, void 0, void 0, function* () {
    if (!(0, is_defined_1.isDefined)(waku.relay)) {
        return;
    }
    const contentTopicFees = waku_topics_1.contentTopics.fees(chain);
    yield waku.relay.subscribe((0, core_1.createDecoder)(contentTopicFees), (message) => (0, handle_fees_message_1.handleRelayerFeesMessage)(chain, message, contentTopicFees));
    yield waku.relay.subscribe((0, core_1.createDecoder)(waku_topics_1.contentTopics.transactResponse(chain)), relayer_transact_response_1.RelayerTransactResponse.handleRelayerTransactionResponseMessage);
    const currentContentTopics = WakuObservers.getCurrentContentTopics(waku);
    relayer_debug_1.RelayerDebug.log('Waku content topics:');
    for (const observer of currentContentTopics) {
        relayer_debug_1.RelayerDebug.log(observer);
    }
});
//# sourceMappingURL=waku-observers.js.map