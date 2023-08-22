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
exports.WakuRelayerWakuCore = void 0;
const shared_models_1 = require("@railgun-community/shared-models");
const core_1 = require("@waku/core");
const interfaces_1 = require("@waku/interfaces");
const waku_observers_1 = require("./waku-observers");
const relayer_debug_1 = require("../utils/relayer-debug");
const relayer_fee_cache_1 = require("../fees/relayer-fee-cache");
const conversion_1 = require("../utils/conversion");
const is_defined_1 = require("../utils/is-defined");
const bootstrap_1 = require("@libp2p/bootstrap");
const create_1 = require("@waku/create");
const constants_1 = require("../models/constants");
class WakuRelayerWakuCore {
    static setRelayerOptions(relayerOptions) {
        if ((0, is_defined_1.isDefined)(relayerOptions.pubSubTopic)) {
            WakuRelayerWakuCore.pubSubTopic = relayerOptions.pubSubTopic;
        }
        if (relayerOptions.additionalDirectPeers) {
            WakuRelayerWakuCore.additionalDirectPeers =
                relayerOptions.additionalDirectPeers;
        }
        if ((0, is_defined_1.isDefined)(relayerOptions.peerDiscoveryTimeout)) {
            WakuRelayerWakuCore.peerDiscoveryTimeout =
                relayerOptions.peerDiscoveryTimeout;
        }
    }
    static getMeshPeerCount() {
        var _b, _c;
        return (_c = (_b = this.waku) === null || _b === void 0 ? void 0 : _b.relay.getMeshPeers().length) !== null && _c !== void 0 ? _c : 0;
    }
    static waitForRemotePeer(waku) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const protocols = [interfaces_1.Protocols.Relay];
                yield (0, shared_models_1.promiseTimeout)((0, core_1.waitForRemotePeer)(waku, protocols), WakuRelayerWakuCore.peerDiscoveryTimeout);
            }
            catch (err) {
                if (!(err instanceof Error)) {
                    throw err;
                }
                relayer_debug_1.RelayerDebug.error(err);
                throw new Error(err.message);
            }
        });
    }
    static relayMessage(data, contentTopic) {
        var _b;
        return __awaiter(this, void 0, void 0, function* () {
            if (!((_b = WakuRelayerWakuCore.waku) === null || _b === void 0 ? void 0 : _b.relay)) {
                throw new Error('No Waku Relay found.');
            }
            const dataString = JSON.stringify(data);
            const payload = (0, conversion_1.utf8ToBytes)(dataString);
            const message = { payload };
            try {
                yield WakuRelayerWakuCore.waku.relay.send((0, core_1.createEncoder)({ contentTopic }), message);
            }
            catch (err) {
                if (!(err instanceof Error)) {
                    throw err;
                }
                relayer_debug_1.RelayerDebug.error(err);
            }
        });
    }
}
exports.WakuRelayerWakuCore = WakuRelayerWakuCore;
_a = WakuRelayerWakuCore;
WakuRelayerWakuCore.hasError = false;
WakuRelayerWakuCore.pubSubTopic = constants_1.WAKU_RAILGUN_PUB_SUB_TOPIC;
WakuRelayerWakuCore.additionalDirectPeers = [];
WakuRelayerWakuCore.peerDiscoveryTimeout = 60000;
WakuRelayerWakuCore.initWaku = (chain) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield WakuRelayerWakuCore.connect();
        if (!WakuRelayerWakuCore.waku) {
            relayer_debug_1.RelayerDebug.log('No waku instance found');
            return;
        }
        waku_observers_1.WakuObservers.resetCurrentChain();
        yield waku_observers_1.WakuObservers.setObserversForChain(WakuRelayerWakuCore.waku, chain);
    }
    catch (err) {
        if (!(err instanceof Error)) {
            throw err;
        }
        relayer_debug_1.RelayerDebug.error(err);
        throw err;
    }
});
WakuRelayerWakuCore.reinitWaku = (chain) => __awaiter(void 0, void 0, void 0, function* () {
    if ((0, is_defined_1.isDefined)(WakuRelayerWakuCore.waku) &&
        WakuRelayerWakuCore.waku.isStarted()) {
        yield WakuRelayerWakuCore.disconnect();
    }
    relayer_fee_cache_1.RelayerFeeCache.resetCache(chain);
    yield WakuRelayerWakuCore.initWaku(chain);
});
WakuRelayerWakuCore.disconnect = () => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    yield ((_b = WakuRelayerWakuCore.waku) === null || _b === void 0 ? void 0 : _b.stop());
    WakuRelayerWakuCore.waku = undefined;
});
WakuRelayerWakuCore.connect = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        WakuRelayerWakuCore.hasError = false;
        relayer_debug_1.RelayerDebug.log(`Creating waku relay client`);
        const peers = [
            ...constants_1.WAKU_RAILGUN_DEFAULT_PEERS,
            ..._a.additionalDirectPeers,
        ];
        const waitTimeoutBeforeBootstrap = 250;
        const waku = yield (0, create_1.createRelayNode)({
            pubSubTopic: WakuRelayerWakuCore.pubSubTopic,
            libp2p: {
                peerDiscovery: [
                    (0, bootstrap_1.bootstrap)({
                        list: peers,
                        timeout: waitTimeoutBeforeBootstrap,
                    }),
                ],
            },
        });
        relayer_debug_1.RelayerDebug.log('Start Waku.');
        yield waku.start();
        relayer_debug_1.RelayerDebug.log('Waiting for remote peer.');
        yield _a.waitForRemotePeer(waku);
        if (!(0, is_defined_1.isDefined)(waku.relay)) {
            throw new Error('No Waku Relay instantiated.');
        }
        relayer_debug_1.RelayerDebug.log('Waku peers:');
        for (const peer of waku.relay.getMeshPeers()) {
            relayer_debug_1.RelayerDebug.log(JSON.stringify(peer));
        }
        relayer_debug_1.RelayerDebug.log('Connected to Waku');
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
});
//# sourceMappingURL=waku-relayer-waku-core.js.map