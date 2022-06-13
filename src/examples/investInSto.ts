import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import {
  OfferingBalanceStatus,
  OfferingSaleStatus,
  OfferingTimingStatus,
} from '@polymathnetwork/polymesh-sdk/types';

import { getClient } from '~/common/client';

/*
  This script showcases Offering investment functionality. It:
  - Fetches all Offerings for a Asset
  - Invests in one of them
*/
(async (): Promise<void> => {
  console.log('Connecting to the node...\n\n');
  const api = await getClient(process.env.ACCOUNT_SEED);

  const ticker = process.argv[2];

  if (!ticker) {
    throw new Error('Please supply a ticker as an argument to the script');
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const identity = (await api.getSigningIdentity())!;
  const asset = await api.assets.getAsset({ ticker });

  const fundingPortfolio = await identity.portfolios.getPortfolio();
  const purchasePortfolio = await identity.portfolios.getPortfolio({
    portfolioId: new BigNumber(2),
  });

  const [, { offering }] = await asset.offerings.get({
    status: {
      timing: OfferingTimingStatus.Started,
      sale: OfferingSaleStatus.Live,
      balance: OfferingBalanceStatus.Available,
    },
  });

  // Invest
  const investQ = await offering.invest({
    purchasePortfolio,
    fundingPortfolio,
    purchaseAmount: new BigNumber(10),
    maxPrice: new BigNumber(110),
  });

  await investQ.run();

  await api.disconnect();
})();
