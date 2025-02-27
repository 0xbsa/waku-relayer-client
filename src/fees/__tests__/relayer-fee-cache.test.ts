/// <reference types="../../types/index" />
import { CachedTokenFee } from '@railgun-community/shared-models';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { MOCK_CHAIN_ETHEREUM } from '../../tests/mocks.test';
import { RelayerFeeCache, RelayerFeeCacheState } from '../relayer-fee-cache';

chai.use(chaiAsPromised);
const { expect } = chai;

const initialState: RelayerFeeCacheState = {
  forNetwork: {},
};

const chain = MOCK_CHAIN_ETHEREUM;

const tokenAddress = '0x1234567890';
const cachedTokenFee: CachedTokenFee = {
  feePerUnitGas: '0x01',
  expiration: 10000,
  feesID: 'ID',
  availableWallets: 2,
  relayAdapt: '0x4567',
};
const tokenFeeMap: MapType<CachedTokenFee> = {
  [tokenAddress]: cachedTokenFee,
};
const railgunAddress = '1234';
const identifier = 'abc';
const feeExpiration = Date.now() + 10000000;

describe('relayer-fee-cache', () => {
  it('Should return relayer-fee-cache initial state', () => {
    RelayerFeeCache.resetCache(chain);

    // @ts-ignore
    expect(RelayerFeeCache.cache).to.deep.equal(initialState);

    expect(RelayerFeeCache.feesForChain(chain)).to.equal(undefined);
  });

  it('Should not update relayer fees for bad relayer versions', () => {
    RelayerFeeCache.resetCache(chain);

    RelayerFeeCache.addTokenFees(
      chain,
      railgunAddress,
      feeExpiration,
      tokenFeeMap,
      identifier,
      '3.99', // too low
    );

    RelayerFeeCache.addTokenFees(
      chain,
      railgunAddress,
      feeExpiration,
      tokenFeeMap,
      identifier,
      '5.0.0', // too high
    );

    expect(RelayerFeeCache.feesForChain(chain)).to.equal(undefined);
  });

  it('Should not update relayer fees for incorrect chain', () => {
    RelayerFeeCache.resetCache(chain);

    RelayerFeeCache.addTokenFees(
      { ...MOCK_CHAIN_ETHEREUM, id: 2 },
      railgunAddress,
      feeExpiration,
      tokenFeeMap,
      identifier,
      '4.22',
    );

    expect(RelayerFeeCache.feesForChain(chain)).to.equal(undefined);
  });

  it('Should update relayer fees for chain', () => {
    RelayerFeeCache.resetCache(chain);

    RelayerFeeCache.addTokenFees(
      chain,
      railgunAddress,
      feeExpiration,
      tokenFeeMap,
      identifier,
      '4.2.2.99', // version
    );

    expect(RelayerFeeCache.feesForChain(chain)).to.deep.equal({
      forToken: {
        [tokenAddress]: {
          forRelayer: {
            [railgunAddress]: {
              forIdentifier: { [identifier]: cachedTokenFee },
            },
          },
        },
      },
    });
  });
});
