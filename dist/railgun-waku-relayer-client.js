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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RailgunWakuRelayerClient = void 0;
const shared_models_1 = require("@railgun-community/shared-models");
const relayer_fee_cache_1 = require("./fees/relayer-fee-cache");
const address_filter_1 = require("./filters/address-filter");
const best_relayer_1 = require("./search/best-relayer");
const relayer_connection_status_1 = require("./status/relayer-connection-status");
const relayer_debug_1 = require("./utils/relayer-debug");
const waku_observers_1 = require("./waku/waku-observers");
const waku_relayer_waku_core_1 = require("./waku/waku-relayer-waku-core");
class RailgunWakuRelayerClient {
    static start(chain, relayerOptions, statusCallback, relayerDebugger) {
        return __awaiter(this, void 0, void 0, function* () {
            this.chain = chain;
            this.statusCallback = statusCallback;
            waku_relayer_waku_core_1.WakuRelayerWakuCore.setRelayerOptions(relayerOptions);
            if (relayerDebugger) {
                relayer_debug_1.RelayerDebug.setDebugger(relayerDebugger);
            }
            try {
                this.started = false;
                yield waku_relayer_waku_core_1.WakuRelayerWakuCore.initWaku(chain);
                this.started = true;
                this.pollStatus();
            }
            catch (err) {
                if (!(err instanceof Error)) {
                    throw err;
                }
                throw new Error(`Cannot connect to Relayer network: ${err.message}`);
            }
        });
    }
    static stop() {
        return __awaiter(this, void 0, void 0, function* () {
            yield waku_relayer_waku_core_1.WakuRelayerWakuCore.disconnect();
            this.started = false;
            this.updateStatus();
        });
    }
    static isStarted() {
        return this.started;
    }
    static setChain(chain) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!RailgunWakuRelayerClient.started) {
                return;
            }
            RailgunWakuRelayerClient.chain = chain;
            yield waku_observers_1.WakuObservers.setObserversForChain(waku_relayer_waku_core_1.WakuRelayerWakuCore.waku, chain);
            RailgunWakuRelayerClient.updateStatus();
        });
    }
    static getContentTopics() {
        return waku_observers_1.WakuObservers.getCurrentContentTopics(waku_relayer_waku_core_1.WakuRelayerWakuCore.waku);
    }
    static getMeshPeerCount() {
        return waku_relayer_waku_core_1.WakuRelayerWakuCore.getMeshPeerCount();
    }
    static findBestRelayer(chain, tokenAddress, useRelayAdapt) {
        if (!RailgunWakuRelayerClient.started) {
            return;
        }
        return best_relayer_1.RelayerSearch.findBestRelayer(chain, tokenAddress, useRelayAdapt);
    }
    static setAddressFilters(allowlist, blocklist) {
        address_filter_1.AddressFilter.setAllowlist(allowlist);
        address_filter_1.AddressFilter.setBlocklist(blocklist);
    }
    static tryReconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            relayer_fee_cache_1.RelayerFeeCache.resetCache(RailgunWakuRelayerClient.chain);
            RailgunWakuRelayerClient.updateStatus();
            yield RailgunWakuRelayerClient.restart();
        });
    }
    static supportsToken(chain, tokenAddress, useRelayAdapt) {
        return relayer_fee_cache_1.RelayerFeeCache.supportsToken(chain, tokenAddress, useRelayAdapt);
    }
    static restart() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isRestarting) {
                return;
            }
            this.isRestarting = true;
            try {
                yield waku_relayer_waku_core_1.WakuRelayerWakuCore.reinitWaku(this.chain);
                this.isRestarting = false;
            }
            catch (err) {
                this.isRestarting = false;
                if (!(err instanceof Error)) {
                    return;
                }
                relayer_debug_1.RelayerDebug.log('Error reinitializing Waku Relayer Client');
                relayer_debug_1.RelayerDebug.error(err);
            }
        });
    }
    static pollStatus() {
        return __awaiter(this, void 0, void 0, function* () {
            this.updateStatus();
            yield (0, shared_models_1.delay)(RailgunWakuRelayerClient.pollDelay);
            this.pollStatus();
        });
    }
    static updateStatus() {
        const status = relayer_connection_status_1.RelayerStatus.getRelayerConnectionStatus(this.chain);
        this.statusCallback(this.chain, status);
        if (status === shared_models_1.RelayerConnectionStatus.Disconnected ||
            status === shared_models_1.RelayerConnectionStatus.Error) {
            this.restart();
        }
    }
}
exports.RailgunWakuRelayerClient = RailgunWakuRelayerClient;
RailgunWakuRelayerClient.started = false;
RailgunWakuRelayerClient.isRestarting = false;
RailgunWakuRelayerClient.pollDelay = 10000;
//# sourceMappingURL=railgun-waku-relayer-client.js.map