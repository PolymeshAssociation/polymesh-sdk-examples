import { Account } from '@polymathnetwork/polymesh-sdk/internal';

import { getClient } from '~/common/client';

/* 
  This script queries the current identity's signing keys
    and removes the first one
*/
(async (): Promise<void> => {
  console.log('Connecting to the node...\n\n');
  const api = await getClient(process.env.ACCOUNT_SEED);

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const identity = (await api.getCurrentIdentity())!;
  console.log(`Connected! Current identity ID: ${identity.did}`);

  let signingKeys = await identity.getSecondaryKeys();

  console.log('Signing keys:');
  signingKeys.forEach(({ signer }) => {
    if (signer instanceof Account) {
      console.log(`- Type: Account, Value: ${signer.address}`);
    } else {
      console.log(`- Type: Account, Value: ${signer.did}`);
    }
  });

  const removeKeysQ = await identity.removeSecondaryKeys({
    signers: signingKeys.slice(0, 1).map(({ signer }) => signer),
  });

  console.log('Removing first key');
  await removeKeysQ.run();

  signingKeys = await identity.getSecondaryKeys();

  console.log('Signing keys (after removing):');
  signingKeys.forEach(({ signer }) => {
    if (signer instanceof Account) {
      console.log(`- Type: Account, Value: ${signer.address}`);
    } else {
      console.log(`- Type: Account, Value: ${signer.did}`);
    }
  });
})();
