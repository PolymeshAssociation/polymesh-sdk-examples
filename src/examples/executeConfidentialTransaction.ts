import { BigNumber } from '@polymeshassociation/polymesh-sdk';

import { getClient } from '~/common/client';

/* 
  This script showcases affirming of confidential transaction
*/
(async (): Promise<void> => {
  console.log('Connecting to the node...\n');
  const account = process.argv[2];
  const transactionId = process.argv[3];

  if (!account) {
    throw new Error('Please specify both account and public key for creating confidential account');
  }
  const api = await getClient(process.env[account]);

  const signingIdentity = await api.getSigningIdentity();
  if (!signingIdentity) {
    throw new Error(`Account information not found for ${account}`);
  }

  console.log(`\n💡 Executing transaction ${transactionId}`);

  const transaction = await api.confidentialSettlements.getTransaction({
    id: new BigNumber(transactionId),
  });

  const executeTx = await transaction.execute();

  await executeTx.run();

  console.log(`\n✅ Transaction ${transactionId} is now executed`);

  await api.disconnect();
})();
