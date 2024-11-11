import { getClient } from '~/common/client';
import { isAssetId } from '~/common/utils';

/* 
  This script retrieves the balance of a specific asset
    held by the signing Identity
*/
(async (): Promise<void> => {
  console.log('Connecting to the node...\n\n');
  const api = await getClient(process.env.ACCOUNT_SEED);

  const asset = process.argv[2];

  if (!asset) {
    throw new Error('Please supply a ticker / Asset ID as an argument to the script');
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const identity = (await api.getSigningIdentity())!;
  console.log(`Connected! Signing Identity ID: ${identity.did}`);

  let balance;
  if (isAssetId(asset)) {
    balance = await identity.getAssetBalance({ assetId: asset });
  } else {
    balance = await identity.getAssetBalance({ ticker: asset });
  }

  console.log(`Balance of "${asset}" is ${balance.toFormat()}`);

  await api.disconnect();
})();
