import { BigNumber } from '@polymeshassociation/polymesh-private-sdk';

import { getClient } from '~/common/privateClient';
// import { getConfidentialAssetDetails } from '~/examples/confidentialAssetDetails';

/* 
  This script showcases Confidential Asset related functionality. It:
    - it will create a new asset 
    - mint into given account
*/
(async (): Promise<void> => {
  console.log('Connecting to the node...\n');
  const account = process.argv[2];
  const auditor = process.argv[3];
  const owner = process.argv[4];
  if (!account || !auditor) {
    throw new Error('Please specify the account, auditor for creating confidential asset');
  }
  const api = await getClient(process.env[account]);

  const signingIdentity = await api.getSigningIdentity();
  if (!signingIdentity) {
    throw new Error(`Account information not found for ${account}`);
  }
  console.log(`\n💡 Creating a new confidential asset for ${account} DID - ${signingIdentity.did}`);

  const createTx = await api.confidentialAssets.createConfidentialAsset({
    data: 'Some Random Data',
    auditors: [auditor],
  });

  const createdConfidentialAsset = await createTx.run();

  console.log(`\n✅ New confidential asset created with ID - ${createdConfidentialAsset.id}`);

  // await getConfidentialAssetDetails(createdConfidentialAsset);

  console.log('\n----------------------------------------------------------------------\n');

  console.log('\n💡 Minting some assets : ');

  const amount = new BigNumber(10000);
  const issueTx = await createdConfidentialAsset.issue({
    confidentialAccount: owner,
    amount,
  });

  await issueTx.run();

  console.log(
    `\n✅ Minted a total of ${amount.toString()} assets with ID - ${createdConfidentialAsset.id}`
  );

  await api.disconnect();
})();
