import { BigNumber } from '@polymeshassociation/polymesh-sdk';

import { getClient } from '~/common/client';
import { getTransactionDetails } from '~/examples/confidentialTransactionDetails';

/* 
  This script showcases how to get a confidential asset instance with its ID and get all the relevant info about it
*/
(async (): Promise<void> => {
  console.log('Connecting to the node...\n');
  const account = process.argv[2];
  const sender = process.argv[3];
  const receiver = process.argv[4];
  const mediator = process.argv[5];
  const venueId = process.argv[6];
  const assetId = process.argv[7];
  if (!account || !process.env[account]) {
    throw new Error('Please specify the account to be used to create the venue');
  }
  if (!sender || !receiver || !mediator || !venueId) {
    throw new Error('Please specify all the transaction details');
  }

  const api = await getClient(process.env[account]);

  const signingIdentity = await api.getSigningIdentity();
  if (!signingIdentity) {
    throw new Error(`Account information not found for ${account}`);
  }

  console.log(
    `\n💡 Creating a new confidential transaction using ${account} DID - ${signingIdentity.did}`
  );

  const venue = await api.confidentialSettlements.getVenue({ id: new BigNumber(venueId) });

  const addTransactionTx = await venue.addTransaction({
    legs: [
      {
        sender,
        receiver,
        auditors: [],
        mediators: [mediator],
        assets: [assetId],
      },
    ],
  });

  const createdTransaction = await addTransactionTx.run();

  console.log(
    `\n✅ New confidential transaction created with ID - ${createdTransaction.toHuman()}`
  );

  await getTransactionDetails(createdTransaction);

  await api.disconnect();
})();
