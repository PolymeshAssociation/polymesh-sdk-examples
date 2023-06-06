import { BigNumber, Polymesh } from '@polymeshassociation/polymesh-sdk';
import { TargetTreatment } from '@polymeshassociation/polymesh-sdk/types';

import { wellKnown } from '~/consts';

/*
  This script showcases Dividend Distribution related functionality. It:
    - Creates a Dividend Distribution
    - Modifies its Checkpoint
    - Fetches the Distribution details
    - Fetches all the Distribution participants
    - Pushes dividend payments
    - Claims dividend payment
    - Reclaims remaining funds
    - Fetches Dividend Distributions
*/
export const manageDistributions = async (
  sdk: Polymesh,
  ticker: string,
  distributionTicker: string
): Promise<void> => {
  const signingIdentity = await sdk.getSigningIdentity();
  if (!signingIdentity) {
    throw new Error('the SDK must have a signing identity');
  }

  const alice = await sdk.identities.getIdentity({ did: wellKnown.alice.did });

  // The signing identity should be an agent of the Asset and have appropriate permission
  const asset = await sdk.assets.getAsset({ ticker });

  // fetch all current distributions for the Asset
  const allDistributions = await asset.corporateActions.distributions.get();
  const paymentDate = new Date();
  paymentDate.setDate(paymentDate.getDate() + 30);

  // create a checkpoint, the recipients will be calculated by their balance at this checkpoint
  const checkpointTx = await asset.checkpoints.create();
  const checkpoint = await checkpointTx.run();
  const declarationDate = new Date();
  declarationDate.setDate(declarationDate.getDate() - 1);
  // this creates a Corporate Action under the hood and then uses it to create the Dividend Distribution
  const createDistributionTx = await asset.corporateActions.distributions.configureDividendDistribution(
    {
      checkpoint,
      currency: distributionTicker,
      perShare: new BigNumber(10),
      maxAmount: new BigNumber(500),
      paymentDate,
      declarationDate,
      expiryDate: undefined, // never expire
      description: 'A sample distribution',
      // set the default tax rate to withhold
      defaultTaxWithholding: new BigNumber(10),
      // (optional) individuals can be excluded from distributions
      targets: {
        // identities can be specified with an Identity object or DID string
        identities: [alice, '0x0200000000000000000000000000000000000000000000000000000000000000'],
        treatment: TargetTreatment.Exclude,
      },
      // (optional) individual holders can be targeted with a different rate
      taxWithholdings: [
        {
          identity: signingIdentity,
          percentage: new BigNumber(25),
        },
      ],
    }
  );
  const distribution = await createDistributionTx.run();
  // get all participants, their owed amount and whether they have been paid or not. This can be slow with a large number of holders
  const participants = await distribution.getParticipants();
  // the Checkpoint can be modified before the payment date
  const modifyCheckpointTx = await distribution.modifyCheckpoint({ checkpoint });
  await modifyCheckpointTx.run();
  // fetch distribution details (whether funds have been reclaimed and the amount of remaining funds)
  const { remainingFunds, fundsReclaimed } = await distribution.details();
  // Once the payment date has been reached these actions can be taken

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const afterPaymentDateActions = async () => {
    // claim Dividend payment for the signing Identity
    const claimTx = await distribution.claim();
    await claimTx.run();

    // push Dividend payments to specific participants
    const paymentTx = await distribution.pay({
      targets: [participants[0].identity],
    });
    await paymentTx.run();

    // reclaim remaining funds after expiry
    const reclaimTx = await distribution.reclaimFunds();
    await reclaimTx.run();
  };
};
