import {
  Chain,
  delay,
  RelayerConnectionStatus,
  SelectedRelayer,
} from '@railgun-community/shared-models';
import { RelayerFeeCache } from './fees/relayer-fee-cache.js';
import { AddressFilter } from './filters/address-filter.js';
import {
  RelayerConnectionStatusCallback,
  RelayerDebugger,
  RelayerOptions,
} from './models/export-models.js';
import { RelayerSearch } from './search/best-relayer.js';
import { RelayerStatus } from './status/relayer-connection-status.js';
import { RelayerDebug } from './utils/relayer-debug.js';
import { WakuObservers } from './waku/waku-observers.js';
import { WakuRelayerWakuCore } from './waku/waku-relayer-waku-core.js';

export class RailgunWakuRelayerClient {
  private static chain: Chain;
  private static statusCallback: RelayerConnectionStatusCallback;
  private static started = false;
  private static isRestarting = false;

  static pollDelay = 10000;

  static async start(
    chain: Chain,
    relayerOptions: RelayerOptions,
    statusCallback: RelayerConnectionStatusCallback,
    relayerDebugger?: RelayerDebugger,
  ) {
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

      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.pollStatus();
    } catch (err) {
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

  static async setChain(chain: Chain): Promise<void> {
    if (!RailgunWakuRelayerClient.started) {
      return;
    }

    RailgunWakuRelayerClient.chain = chain;
    await WakuObservers.setObserversForChain(WakuRelayerWakuCore.waku, chain);
    RailgunWakuRelayerClient.updateStatus();
  }

  static getContentTopics(): string[] {
    return WakuObservers.getCurrentContentTopics(WakuRelayerWakuCore.waku);
  }

  static getMeshPeerCount(): number {
    return WakuRelayerWakuCore.getMeshPeerCount();
  }

  static findBestRelayer(
    chain: Chain,
    tokenAddress: string,
    useRelayAdapt: boolean,
  ): Optional<SelectedRelayer> {
    if (!RailgunWakuRelayerClient.started) {
      return;
    }

    return RelayerSearch.findBestRelayer(chain, tokenAddress, useRelayAdapt);
  }

  static setAddressFilters(
    allowlist: Optional<string[]>,
    blocklist: Optional<string[]>,
  ): void {
    AddressFilter.setAllowlist(allowlist);
    AddressFilter.setBlocklist(blocklist);
  }

  static async tryReconnect(): Promise<void> {
    // Reset fees, which will reset status to "Searching".
    RelayerFeeCache.resetCache(RailgunWakuRelayerClient.chain);
    RailgunWakuRelayerClient.updateStatus();

    await RailgunWakuRelayerClient.restart();
  }

  static supportsToken(
    chain: Chain,
    tokenAddress: string,
    useRelayAdapt: boolean,
  ) {
    return RelayerFeeCache.supportsToken(chain, tokenAddress, useRelayAdapt);
  }

  private static async restart(): Promise<void> {
    if (this.isRestarting) {
      return;
    }
    this.isRestarting = true;
    try {
      await WakuRelayerWakuCore.reinitWaku(this.chain);
      this.isRestarting = false;
    } catch (err) {
      this.isRestarting = false;
      if (!(err instanceof Error)) {
        return;
      }
      RelayerDebug.log('Error reinitializing Waku Relayer Client');
      RelayerDebug.error(err);
    }
  }

  /**
   * Start keep-alive poller which checks Relayer status every few seconds.
   */
  private static async pollStatus(): Promise<void> {
    this.updateStatus();

    await delay(RailgunWakuRelayerClient.pollDelay);

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.pollStatus();
  }

  private static updateStatus() {
    const status = RelayerStatus.getRelayerConnectionStatus(this.chain);

    this.statusCallback(this.chain, status);

    if (
      status === RelayerConnectionStatus.Disconnected ||
      status === RelayerConnectionStatus.Error
    ) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.restart();
    }
  }
}
