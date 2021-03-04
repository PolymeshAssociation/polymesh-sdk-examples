import {
  StoBalanceStatus,
  StoSaleStatus,
  StoTimingStatus,
} from '@polymathnetwork/polymesh-sdk/types';
import BigNumber from 'bignumber.js';

import { getClient } from '~/common/client';

/* 
  This script showcases STO investment functionality. It:
  - Fetches all STOs for a Token
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
  const identity = (await api.getCurrentIdentity())!;
  const token = await api.getSecurityToken({ ticker });

  const fundingPortfolio = await identity.portfolios.getPortfolio();
  const purchasePortfolio = await identity.portfolios.getPortfolio({
    portfolioId: new BigNumber(2),
  });

  const [{ sto }] = await token.offerings.get({
    status: {
      timing: StoTimingStatus.Started,
      sale: StoSaleStatus.Live,
      balance: StoBalanceStatus.Available,
    },
  });

  // Invest
  const investQ = await sto.invest({
    purchasePortfolio,
    fundingPortfolio,
    purchaseAmount: new BigNumber(100),
    maxPrice: new BigNumber(1100),
  });

  await investQ.run();
})();
