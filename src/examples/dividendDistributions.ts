import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { FungibleAsset, TargetTreatment } from '@polymeshassociation/polymesh-sdk/types';
import { isCheckpoint } from '@polymeshassociation/polymesh-sdk/utils';

import { getClient } from '~/common/client';
import { isAssetId } from '~/common/utils';

/*
  This script showcases Dividend Distribution related functionality. It:
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
  const identity = (await api.getSigningIdentity())!;
  console.log(`Connected! Signing Identity ID: ${identity.did}`);

  const assetInput = process.argv[2];

  if (!assetInput) {
    throw new Error('Please supply a ticker or Asset Id as an argument to the script');
  }

  let asset: FungibleAsset;
  if (isAssetId(assetInput)) {
    asset = await api.assets.getFungibleAsset({ assetId: assetInput });
  } else {
    asset = await api.assets.getFungibleAsset({ ticker: assetInput });
  }
  console.log(`Asset found! Current asset name is: ${(await asset.details()).name}`);

  const originPortfolio = await identity.portfolios.getPortfolio({ portfolioId: new BigNumber(1) });

  const nextMonth = new Date();
  nextMonth.setDate(nextMonth.getDate() + 30);
  const checkpointDate = new Date();
  checkpointDate.setDate(checkpointDate.getDate() + 20);
  // this creates a Corporate Action under the hood and then uses it to create the Dividend Distribution
  const createQ = await asset.corporateActions.distributions.configureDividendDistribution({
    checkpoint: checkpointDate,
    originPortfolio, // optional, defaults to the CAA's default portfolio
    currency: '0xafacdf5f5f368b6790bd807aed1bf2e4',
    perShare: new BigNumber(10),
    maxAmount: new BigNumber(500),
    paymentDate: nextMonth,
    // expiryDate: undefined, means the distribution doesn't expire
    declarationDate: new Date('10/14/2020'),
    description: 'Gonna throw some money around',
    targets: {
      identities: [
        '0x0100000000000000000000000000000000000000000000000000000000000000',
        '0x0200000000000000000000000000000000000000000000000000000000000000',
        '0x0300000000000000000000000000000000000000000000000000000000000000',
      ], // can be Identity objects as well
      treatment: TargetTreatment.Include,
    }, // optional
    defaultTaxWithholding: new BigNumber(10),
    taxWithholdings: [
      {
        identity: '0x0100000000000000000000000000000000000000000000000000000000000000',
        percentage: new BigNumber(15),
      },
    ],
  });
  const distribution = await createQ.run();

  const [{ checkpoint }] = (await asset.checkpoints.get()).data;

  // the Checkpoint can be modified before the payment date
  const modifyCheckpointQ = await distribution.modifyCheckpoint({ checkpoint });
  await modifyCheckpointQ.run();

  // fetch new Checkpoint
  const newCheckpoint = await distribution.checkpoint();

  let creationDate: Date;
  if (isCheckpoint(newCheckpoint)) {
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

  // claim Dividend payment for the signing Identity
  const claimQ = await distribution.claim();
  await claimQ.run();

  // reclaim remaining funds after expiry
  const reclaimQ = await distribution.reclaimFunds();
  await reclaimQ.run();

  // fetch all distributions for the Asset
  const allDistributions = await asset.corporateActions.distributions.get();
  allDistributions.forEach(({ distribution: dist, details }) => {
    console.log(`Distribution ${dist.id.toFormat()}:
      - Funds reclaimed: ${details.fundsReclaimed}
      - Remaining funds: ${details.remainingFunds.toFormat()}
    `);
  });

  await api.disconnect();
})();
