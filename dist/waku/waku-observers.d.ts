import { Chain } from '@railgun-community/shared-models';
import { RelayNode } from '@waku/interfaces';
export declare class WakuObservers {
    private static currentChain;
    static setObserversForChain: (waku: Optional<RelayNode>, chain: Chain) => Promise<void>;
    static resetCurrentChain: () => void;
    private static removeAllObservers;
    private static addChainObservers;
    static getCurrentContentTopics(waku?: RelayNode): string[];
}
