import { BigNumber } from '@polymeshassociation/polymesh-private-sdk';
import { ConfidentialTransaction } from '@polymeshassociation/polymesh-private-sdk/types';

import { getClient } from '~/common/privateClient';
import { toHumanObject } from '~/common/utils';

/**
 * Retrieves all relevant info about a confidential transaction
 */
export async function getTransactionDetails(transaction: ConfidentialTransaction) {
  console.log('\n----------------------------------------------------------------------\n');
  console.log('\n💡 Getting info about confidential transaction : ', transaction.toHuman());

  const [exists, details, legs, involvedParties, legStates, pendingAffirmCount] = await Promise.all(
    [
      transaction.exists(),
      transaction.details(),
      transaction.getLegs(),
      transaction.getInvolvedParties(),
      transaction.getLegStates(),
      transaction.getPendingAffirmsCount(),
    ]
  );

  console.log('\nℹ️ Exists - ', exists);
  console.log('\nℹ️ Details - ', toHumanObject(details));
  console.log('\nℹ️ Legs - ', toHumanObject(legs));
  console.log('\nℹ️ Involved Parties - ', toHumanObject(involvedParties));
  console.log('\nℹ️ Leg states - ', toHumanObject(legStates));
  console.log('\nℹ️ Pending Affirmations - ', toHumanObject(pendingAffirmCount));
}
/* 
  This script showcases how to get a confidential asset instance with its ID and get all the relevant info about it
*/
(async (): Promise<void> => {
  console.log('Connecting to the node...\n');
  const id = process.argv[2];
  if (!id) {
    throw new Error('Please specify asset ID to fetch the details');
  }
  const api = await getClient();

  const transaction = await api.confidentialSettlements.getTransaction({ id: new BigNumber(id) });

  await getTransactionDetails(transaction);

  await api.disconnect();
})();
