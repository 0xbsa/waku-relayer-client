import { delay, RelayerConnectionStatus, } from '@railgun-community/shared-models';
import { RelayerFeeCache } from './fees/relayer-fee-cache.js';
import { AddressFilter } from './filters/address-filter.js';
import { RelayerSearch } from './search/best-relayer.js';
import { RelayerStatus } from './status/relayer-connection-status.js';
import { RelayerDebug } from './utils/relayer-debug.js';
import { WakuObservers } from './waku/waku-observers.js';
import { WakuRelayerWakuCore } from './waku/waku-relayer-waku-core.js';
export class RailgunWakuRelayerClient {
    static async start(chain, relayerOptions, statusCallback, relayerDebugger) {
        this.chain = chain;
        this.statusCallback = statusCallback;
        WakuRelayerWakuCore.setRelayerOptions(relayerOptions);
        if (relayerDebugger) {
            RelayerDebug.setDebugger(relayerDebugger);
        }
        try {
            this.started = false;
            await WakuRelayerWakuCore.initWaku(chain);
            this.started = true;
            this.pollStatus();
        }
        catch (err) {
            if (!(err instanceof Error)) {
                throw err;
            }
            throw new Error(`Cannot connect to Relayer network: ${err.message}`);
        }
    }
    static async stop() {
        await WakuRelayerWakuCore.disconnect();
        this.started = false;
        this.updateStatus();
    }
    static isStarted() {
        return this.started;
    }
    static async setChain(chain) {
        if (!RailgunWakuRelayerClient.started) {
            return;
        }
        RailgunWakuRelayerClient.chain = chain;
        await WakuObservers.setObserversForChain(WakuRelayerWakuCore.waku, chain);
        RailgunWakuRelayerClient.updateStatus();
    }
    static getContentTopics() {
        return WakuObservers.getCurrentContentTopics(WakuRelayerWakuCore.waku);
    }
    static getMeshPeerCount() {
        return WakuRelayerWakuCore.getMeshPeerCount();
    }
    static findBestRelayer(chain, tokenAddress, useRelayAdapt) {
        if (!RailgunWakuRelayerClient.started) {
            return;
        }
        return RelayerSearch.findBestRelayer(chain, tokenAddress, useRelayAdapt);
    }
    static setAddressFilters(allowlist, blocklist) {
        AddressFilter.setAllowlist(allowlist);
        AddressFilter.setBlocklist(blocklist);
    }
    static async tryReconnect() {
        RelayerFeeCache.resetCache(RailgunWakuRelayerClient.chain);
        RailgunWakuRelayerClient.updateStatus();
        await RailgunWakuRelayerClient.restart();
    }
    static supportsToken(chain, tokenAddress, useRelayAdapt) {
        return RelayerFeeCache.supportsToken(chain, tokenAddress, useRelayAdapt);
    }
    static async restart() {
        if (this.isRestarting) {
            return;
        }
        this.isRestarting = true;
        try {
            await WakuRelayerWakuCore.reinitWaku(this.chain);
            this.isRestarting = false;
        }
        catch (err) {
            this.isRestarting = false;
            if (!(err instanceof Error)) {
                return;
            }
            RelayerDebug.log('Error reinitializing Waku Relayer Client');
            RelayerDebug.error(err);
        }
    }
    static async pollStatus() {
        this.updateStatus();
        await delay(RailgunWakuRelayerClient.pollDelay);
        this.pollStatus();
    }
    static updateStatus() {
        const status = RelayerStatus.getRelayerConnectionStatus(this.chain);
        this.statusCallback(this.chain, status);
        if (status === RelayerConnectionStatus.Disconnected ||
            status === RelayerConnectionStatus.Error) {
            this.restart();
        }
    }
}
RailgunWakuRelayerClient.started = false;
RailgunWakuRelayerClient.isRestarting = false;
RailgunWakuRelayerClient.pollDelay = 10000;
//# sourceMappingURL=railgun-waku-relayer-client.js.map