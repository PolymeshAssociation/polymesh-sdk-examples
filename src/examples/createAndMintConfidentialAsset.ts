import { BigNumber } from '@polymeshassociation/polymesh-sdk';

import { getClient } from '~/common/client';
import { getConfidentialAssetDetails } from '~/examples/confidentialAssetDetails';

/* 
  This script showcases Confidential Asset related functionality. It:
    - it will create a new asset 
    - mint into given account
*/
(async (): Promise<void> => {
  console.log('Connecting to the node...\n');
  const account = process.argv[2];
  const ticker = process.argv[3];
  const auditor = process.argv[4];
  const owner = process.argv[5];
  if (!account || !ticker || !auditor) {
    throw new Error('Please specify the account, ticker, auditor for creating confidential asset');
  }
  const api = await getClient(process.env[account]);

  const signingIdentity = await api.getSigningIdentity();
  if (!signingIdentity) {
    throw new Error(`Account information not found for ${account}`);
  }
  console.log(
    `\n💡 Creating a new confidential asset with ticker ${ticker} for ${account} DID - ${signingIdentity.did}`
  );

  const createTx = await api.confidentialAssets.createConfidentialAsset({
    ticker,
    data: 'Some Random Data',
    auditors: [auditor],
  });

  const createdConfidentialAsset = await createTx.run();

  console.log(`\n✅ New confidential asset created with ID - ${createdConfidentialAsset.id}`);

  await getConfidentialAssetDetails(createdConfidentialAsset);

  console.log('\n----------------------------------------------------------------------\n');

  console.log('\n💡 Minting some assets : ');

  const amount = new BigNumber(10000);
  const issueTx = await createdConfidentialAsset.issue({
    account: owner,
    amount,
  });

  await issueTx.run();

  console.log(
    `\n✅ Minted a total of ${amount.toString()} assets with ID - ${createdConfidentialAsset.id}`
  );

  await api.disconnect();
})();
