import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { TargetTreatment } from '@polymeshassociation/polymesh-sdk/types';
import { isCheckpoint } from '@polymeshassociation/polymesh-sdk/utils';

import { getFungibleAsset } from '~/common/assets';
import { getClient } from '~/common/client';

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
  const currencyInput = process.argv[3] ?? process.env.DIVIDEND_CURRENCY;

  if (!assetInput) {
    throw new Error('Please supply a ticker or Asset Id as an argument to the script');
  }

  if (!currencyInput) {
    throw new Error(
      'Please supply a dividend currency asset ID as the second argument or set DIVIDEND_CURRENCY in the environment'
    );
  }

  const asset = await getFungibleAsset(api, assetInput);
  console.log(`Asset found! Current asset name is: ${(await asset.details()).name}`);

  const checkpointDate = new Date();
  checkpointDate.setMinutes(checkpointDate.getMinutes() + 1);
  const paymentDate = new Date();
  paymentDate.setMinutes(paymentDate.getMinutes() + 2);
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const bobDid = process.env.BOB_DID!;
  // this creates a Corporate Action under the hood and then uses it to create the Dividend Distribution
  const createQ = await asset.corporateActions.distributions.configureDividendDistribution({
    checkpoint: checkpointDate,
    currency: currencyInput,
    perShare: new BigNumber(1),
    maxAmount: new BigNumber(10),
    paymentDate,
    // expiryDate: undefined, means the distribution doesn't expire
    declarationDate: new Date('10/14/2020'),
    description: 'Gonna throw some money around',
    targets: {
      identities: [bobDid],
      treatment: TargetTreatment.Include,
    }, // optional
    defaultTaxWithholding: new BigNumber(10),
    taxWithholdings: [
      {
        identity: bobDid,
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

  const waitMs = Math.max(0, paymentDate.getTime() - Date.now() + 5000);
  if (waitMs > 0) {
    console.log(`Waiting for payment date (${Math.ceil(waitMs / 1000)}s)...`);
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  // push Dividend payments to specific participants
  if (participants.length >= 1) {
    const paymentQ = await distribution.pay({
      targets: [participants[0].identity],
    });
    await paymentQ.run();
  }

  // claim Dividend payment for the signing Identity
  try {
    const claimQ = await distribution.claim();
    await claimQ.run();
  } catch {
    console.log('Skipping claim (signing Identity has no dividend to claim)\n');
  }

  // reclaim remaining funds after expiry
  try {
    const reclaimQ = await distribution.reclaimFunds();
    await reclaimQ.run();
  } catch {
    console.log('Skipping fund reclaim (distribution has not expired)\n');
  }

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
