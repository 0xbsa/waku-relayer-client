import { Chain } from '@railgun-community/shared-models';
import { IMessage } from '@waku/interfaces';
export declare const handleRelayerFeesMessage: (chain: Chain, message: IMessage, contentTopic: string) => Promise<void>;
