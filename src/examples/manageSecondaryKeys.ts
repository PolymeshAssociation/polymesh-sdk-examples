import { Account } from '@polymathnetwork/polymesh-sdk/internal';
import { TxGroup } from '@polymathnetwork/polymesh-sdk/types';

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

  // Account to invite to join the current Identity
  const targetAccount = api.getAccount({
    address: accountAddress,
  });

  const inviteAccount = await identity.inviteAccount({
    targetAccount,
    permissions: {
      portfolios: null,
      // `txGroupToTxTags` can be used to know which TxTags correspond to each group
      transactionGroups: [TxGroup.Issuance, TxGroup.ClaimsManagement],
      tokens: null,
    },
  });

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

  if (signingKeys.length) {
    const modifyPermissions = await identity.modifyPermissions({
      secondaryKeys: [
        {
          signer: signingKeys[0].signer,
          permissions: {
            portfolios: null,
          },
        },
      ],
    });

    console.log('Modifying portfolios permissions to a secondary key...');
    await modifyPermissions.run();
  }

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

  await api.disconnect();
})();
