import { BigNumber } from '@polymeshassociation/polymesh-private-sdk';
import {
  AffirmConfidentialTransactionParams,
  ConfidentialAffirmParty,
} from '@polymeshassociation/polymesh-private-sdk/types';

import { getClient } from '~/common/privateClient';

/* 
  This script showcases affirming of confidential transaction
*/
(async (): Promise<void> => {
  console.log('Connecting to the node...\n');
  const account = process.argv[2];
  const transactionId = process.argv[3];
  const legId = process.argv[4];
  const party = process.argv[5] as ConfidentialAffirmParty;
  const assetId = process.argv[6];
  const proof = process.argv[7];

  if (!account) {
    throw new Error('Please specify both account and public key for creating confidential account');
  }
  const api = await getClient(process.env[account]);

  const signingIdentity = await api.getSigningIdentity();
  if (!signingIdentity) {
    throw new Error(`Account information not found for ${account}`);
  }

  console.log(`\n💡 Affirming transaction ${transactionId} for ${party}`);

  const transaction = await api.confidentialSettlements.getTransaction({
    id: new BigNumber(transactionId),
  });

  let params: AffirmConfidentialTransactionParams;
  if (party === ConfidentialAffirmParty.Sender) {
    params = {
      legId: new BigNumber(legId),
      party,
      proofs: [
        {
          asset: assetId,
          proof,
        },
      ],
    };
  } else {
    params = {
      legId: new BigNumber(legId),
      party,
    };
  }
  const affirmTx = await transaction.affirmLeg(params);

  await affirmTx.run();

  console.log(`\n✅ Transaction ${transactionId} is now affirmed by ${party}`);

  await api.disconnect();
})();
