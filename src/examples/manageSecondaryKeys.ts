import { TxGroup } from '@polymeshassociation/polymesh-sdk/types';

import { getClient } from '~/common/client';

/*
  This script demonstrates Identity functionality. It:
    - Sends an invitation to an Account to join the signing Identity
    - Queries the signing Identity's signing keys
    - Removes the first signing key
*/
(async (): Promise<void> => {
  console.log('Connecting to the node...\n\n');
  const api = await getClient(process.env.ACCOUNT_SEED);

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const identity = (await api.getSigningIdentity())!;
  console.log(`Connected! Signing Identity ID: ${identity.did}`);

  const accountAddress = process.argv[2];

  if (!accountAddress) {
    throw new Error('Please supply an account address as an argument to the script');
  }

  // Account to invite to join the signing Identity
  const targetAccount = await api.accountManagement.getAccount({
    address: accountAddress,
  });

  const inviteAccount = await api.accountManagement.inviteAccount({
    targetAccount,
    permissions: {
      portfolios: null,
      // `txGroupToTxTags` can be used to know which TxTags correspond to each group
      transactionGroups: [TxGroup.Issuance, TxGroup.ClaimsManagement],
      assets: null,
    },
  });

  console.log('Sending invitation to an account...');
  await inviteAccount.run();

  let secondaryAccounts = await identity.getSecondaryAccounts();

  console.log('Signing keys:');
  secondaryAccounts.data.forEach(({ account }) => {
    console.log(`- Type: Account, Value: ${account.address}`);
  });

  if (secondaryAccounts.data.length) {
    const modifyPermissions = await api.accountManagement.modifyPermissions({
      secondaryAccounts: [
        {
          account: secondaryAccounts.data[0].account,
          permissions: {
            portfolios: null,
          },
        },
      ],
    });

    console.log('Modifying portfolios permissions to a secondary key...');
    await modifyPermissions.run();
  }

  const removeKeysQ = await api.accountManagement.removeSecondaryAccounts({
    accounts: secondaryAccounts.data.slice(0, 1).map(({ account }) => account),
  });

  console.log('Removing first key');
  await removeKeysQ.run();

  secondaryAccounts = await identity.getSecondaryAccounts();

  console.log('Signing keys (after removing):');
  secondaryAccounts.data.forEach(({ account }) => {
    console.log(`- Type: Account, Value: ${account.address}`);
  });

  await api.disconnect();
})();
