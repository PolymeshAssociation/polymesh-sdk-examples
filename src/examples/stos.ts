import { BigNumber } from '@polymathnetwork/polymesh-sdk';

import { getClient } from '~/common/client';

/* 
  This script showcases STO functionality. It:
  - Launches an STO
  - Fetches its details
  - Fetches all investments made to date
  - Modifies the start and end time
  - Freezes/unfreezes it
  - Closes it
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
  const [venue] = await identity.getVenues();

  const offeringPortfolio = await identity.portfolios.getPortfolio();
  const raisingPortfolio = await identity.portfolios.getPortfolio({
    portfolioId: new BigNumber(2),
  });

  // Launch
  const launchStoQ = await token.offerings.launch({
    offeringPortfolio, // optional, defaults to the PIA's default portfolio
    raisingPortfolio,
    raisingCurrency: 'USD_STABLECOIN',
    venue, // optional, defaults to the first "Sto" type venue created by the owner of the Offering Portfolio
    name: 'MY_STO',
    start: new Date(new Date().getTime() + 60 * 1000 * 20), // optional, defaults to right now
    end: new Date(new Date().getTime() + 365 * 24 * 60 * 60 * 1000), // optional, defaults to never
    tiers: [
      {
        price: new BigNumber(100),
        amount: new BigNumber(1000),
      },
      {
        price: new BigNumber(150),
        amount: new BigNumber(500),
      },
    ],
    minInvestment: new BigNumber(750),
  });

  // existing STOs can also later be fetched with `token.offerings.get()`
  const sto = await launchStoQ.run();

  console.log(`STO created! ID: ${sto.id}`);

  // Fetch details
  const { totalRemaining, status } = await sto.details();

  console.log(`STO status:
  - balance: ${status.balance}
  - sale: ${status.sale}
  - timing: ${status.timing}
  
  Total remaining tokens: ${totalRemaining.toFormat()}`);

  // Fetch investments
  const { data: investments } = await sto.getInvestments();

  investments.forEach(({ soldAmount, investedAmount, investor }) => {
    console.log(
      `Investor: ${
        investor.did
      }, invested amount: ${investedAmount.toFormat()}, sold amount: ${soldAmount.toFormat()}`
    );
  });

  // Modify start/end time
  const modifyTimesQ = await sto.modifyTimes({
    start: new Date(new Date().getTime() + 30 * 1000),
    end: null,
  });

  await modifyTimesQ.run();

  // Freeze
  const freezeQ = await sto.freeze();
  await freezeQ.run();

  // Unfreeze
  const unfreezeQ = await sto.unfreeze();
  await unfreezeQ.run();

  // Close
  const closeQ = await sto.close();
  await closeQ.run();

  await api.disconnect();
})();
