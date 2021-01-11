import { Account } from '@polymathnetwork/polymesh-sdk/api/entities';

import { getClient } from '~/common/client';

/* 
  This script demonstrates Identity functionality. It:
    - Sends an invitation to an Account to join the current Identity
    - Queries the current Identity's signing keys
    - Removes the first signing key
*/
(async (): Promise<void> => {
  console.log('Connecting to the node...\n\n');
  const api = await getClient(process.env.ACCOUNT_SEED);

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const identity = (await api.getCurrentIdentity())!;
  console.log(`Connected! Current identity ID: ${identity.did}`);

  const accountAddress = process.argv[2];

  if (!accountAddress) {
    throw new Error('Please supply an account address as an argument to the script');
  }

  // Account to invite to join to the current identity
  const targetAccount = await api.getAccount({
    address: accountAddress,
  });

  const inviteAccount = await identity.inviteAccount({ targetAccount });

  console.log('Sending invitation to an account...');
  await inviteAccount.run();

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
