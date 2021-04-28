import { Checkpoint } from '@polymathnetwork/polymesh-sdk/internal';
import { TargetTreatment } from '@polymathnetwork/polymesh-sdk/types';
import BigNumber from 'bignumber.js';

import { getClient } from '~/common/client';

/* 
  This script showcases Dividend Distribution related functonality. It: 
    - Creates a Dividend Distribution
    - Modifies its Checkpoint
    - Fetches the new Checkpoint
    - Fetches the Distribution details
    - Fetches all the Distribution participants
    - Pushes dividend payments
    - Claims dividend payment
    - Reclaims remaining funds
    - Fetches Dividend Distributions
*/
(async (): Promise<void> => {
  console.log('Connecting to the node...\n\n');
  const api = await getClient(process.env.ACCOUNT_SEED);

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const identity = (await api.getCurrentIdentity())!;
  console.log(`Connected! Current identity ID: ${identity.did}`);

  const ticker = process.argv[2];

  if (!ticker) {
    throw new Error('Please supply a ticker as an argument to the script');
  }

  const token = await api.getSecurityToken({ ticker });
  console.log(`Security Token found! Current token name is: ${(await token.details()).name}`);

  const originPortfolio = await identity.portfolios.getPortfolio({ portfolioId: new BigNumber(1) });

  // this creates a Corporate Action under the hood and then uses it to create the Dividend Distribution
  const createQ = await token.corporateActions.distributions.configureDividendDistribution({
    checkpoint: new Date(new Date().getTime() + 1000 * 60 * 20), // can also be a Checkpoint or a CheckpointSchedule
    originPortfolio, // optional, defaults to the CAA's default portfolio
    currency: 'USD',
    perShare: new BigNumber(100),
    maxAmount: new BigNumber(5000000),
    paymentDate: new Date(new Date().getTime() * 1000 * 60 * 60 * 24 * 30), // 30 days from now
    expiryDate: null, // means the distribution doesn't expire
    declarationDate: new Date('10/14/2020'),
    description: 'Gonna throw some money around',
    targets: {
      identities: ['0x01', '0x02', '0x03'], // can be Identity objects as well
      treatment: TargetTreatment.Include,
    }, // optional
    defaultTaxWithholding: new BigNumber(10),
    taxWithholdings: [
      {
        identity: '0x01',
        percentage: new BigNumber(15),
      },
    ],
  });
  const distribution = await createQ.run();

  const [{ checkpoint }] = await token.checkpoints.get();

  // the Checkpoint can be modified before the payment date
  const modifyCheckpointQ = await distribution.modifyCheckpoint({ checkpoint });
  await modifyCheckpointQ.run();

  // fetch new Checkpoint
  const newCheckpoint = await distribution.checkpoint();

  let creationDate: Date;
  if (newCheckpoint instanceof Checkpoint) {
    creationDate = await newCheckpoint.createdAt();
  } else {
    ({ nextCheckpointDate: creationDate } = await newCheckpoint.details());
  }
  console.log('New checkpoint date:', creationDate);

  // fetch distribution details (whether funds have been reclaimed and the amount of remaining funds)
  const { remainingFunds, fundsReclaimed } = await distribution.details();
  console.log(`Reclaimed: ${fundsReclaimed}. Remaining funds: ${remainingFunds.toFormat()}`);

  // get all participants, their owed amount and whether they have been paid or not (this is SLOW)
  const participants = await distribution.getParticipants();
  participants.forEach(({ identity: { did }, amount, paid }) => {
    console.log(`DID ${did} is owed ${amount.toFormat()}. Paid: ${paid}`);
  });

  // push Dividend payments to specific participants
  const paymentQ = await distribution.pay({
    targets: [participants[0].identity, participants[1].identity],
  });
  await paymentQ.run();

  // claim Dividend payment for the current Identity
  const claimQ = await distribution.claim();
  await claimQ.run();

  // reclaim remaining funds after expiry
  const reclaimQ = await distribution.reclaimFunds();
  await reclaimQ.run();

  // fetch all distributions for the Token
  const allDistributions = await token.corporateActions.distributions.get();
  allDistributions.forEach(({ distribution: dist, details }) => {
    console.log(`Distribution ${dist.id.toFormat()}:
      - Funds reclaimed: ${details.fundsReclaimed}
      - Remaining funds: ${details.remainingFunds.toFormat()}
    `);
  });

  await api.disconnect();
})();
