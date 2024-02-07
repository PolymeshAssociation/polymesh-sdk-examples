import { ConfidentialVenue } from '@polymeshassociation/polymesh-sdk/types';

import { getClient } from '~/common/client';
import { toHumanObject } from '~/common/utils';

/**
 * Retrieves all relevant info about a confidential venue
 */
export async function getVenueDetails(venue: ConfidentialVenue) {
  console.log('\n----------------------------------------------------------------------\n');
  console.log('\n💡 Getting all the information about the newly created venue : ');

  const [exists, creator, transactions] = await Promise.all([
    venue.exists(),
    venue.creator(),
    venue.getTransactions(),
  ]);

  console.log('\nℹ️ Exists - ', exists);
  console.log('\nℹ️ Creator - ', creator.toHuman());
  console.log('\nℹ️ Transactions - ', toHumanObject(transactions));
}

/* 
  This script showcases how to get a confidential asset instance with its ID and get all the relevant info about it
*/
(async (): Promise<void> => {
  console.log('Connecting to the node...\n');
  const account = process.argv[2];
  if (!account || !process.env[account]) {
    throw new Error('Please specify the account to be used to create the venue');
  }
  const api = await getClient(process.env[account]);

  const signingIdentity = await api.getSigningIdentity();
  if (!signingIdentity) {
    throw new Error(`Account information not found for ${account}`);
  }
  console.log(
    `\n💡 Creating a new confidential venue using ${account} DID - ${signingIdentity.did}`
  );

  const createVenueTx = await api.confidentialSettlements.createVenue();

  const createdConfidentialVenue = await createVenueTx.run();

  console.log(
    `\n✅ New confidential venue created with ID - ${createdConfidentialVenue.toHuman()}`
  );

  await getVenueDetails(createdConfidentialVenue);

  await api.disconnect();
})();
