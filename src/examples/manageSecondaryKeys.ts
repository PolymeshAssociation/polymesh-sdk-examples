import { LocalSigningManager } from '@polymeshassociation/local-signing-manager';
import { Polymesh } from '@polymeshassociation/polymesh-sdk';
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

  let accountAddress = process.argv[2];

  if (!accountAddress) {
    const mnemonic = LocalSigningManager.generateAccount();
    const signingManager = await LocalSigningManager.create({
      accounts: [{ mnemonic }],
    });
    const tempApi = await Polymesh.connect({
      /* eslint-disable @typescript-eslint/no-non-null-assertion */
      nodeUrl: process.env.POLYMESH_NODE_URL!,
      middlewareV2: {
        link: process.env.MIDDLEWARE_LINK!,
        key: process.env.MIDDLEWARE_KEY!,
      },
      /* eslint-enable @typescript-eslint/no-non-null-assertion */
      signingManager,
    });
    const [generatedAccount] = await tempApi.accountManagement.getSigningAccounts();
    accountAddress = generatedAccount.address;
    await tempApi.disconnect();
    console.log(`Generated unlinked account for invitation: ${accountAddress}`);
  }

  // Account to invite to join the signing Identity
  const targetAccount = await api.accountManagement.getAccount({
    address: accountAddress,
  });

  console.log('Sending invitation to an account...');
  try {
    const inviteAccount = await api.accountManagement.inviteAccount({
      targetAccount,
      permissions: {
        portfolios: null,
        // `txGroupToTxTags` can be used to know which TxTags correspond to each group
        transactionGroups: [TxGroup.Issuance, TxGroup.ClaimsManagement],
        assets: null,
      },
    });
    await inviteAccount.run();
  } catch (error) {
    console.log(`Skipping invitation (${(error as Error).message})\n`);
  }

  let secondaryAccounts = await identity.getSecondaryAccounts();

  console.log('Signing keys:');
  secondaryAccounts.data.forEach(({ account }) => {
    console.log(`- Type: Account, Value: ${account.address}`);
  });

  if (secondaryAccounts.data.length) {
    try {
      const modifyPermissions = await api.accountManagement.modifyPermissions({
        secondaryAccounts: [
          {
            account: secondaryAccounts.data[0].account,
            permissions: {
              portfolios: null,
              assets: null,
              transactionGroups: [TxGroup.Issuance],
            },
          },
        ],
      });

      console.log('Modifying permissions on a secondary key...');
      await modifyPermissions.run();
    } catch (error) {
      console.log(`Skipping permission update (${(error as Error).message})\n`);
    }
  }

  try {
    const removeKeysQ = await api.accountManagement.removeSecondaryAccounts({
      accounts: secondaryAccounts.data.slice(0, 1).map(({ account }) => account),
    });

    console.log('Removing first key');
    await removeKeysQ.run();
  } catch (error) {
    console.log(`Skipping key removal (${(error as Error).message})\n`);
  }

  secondaryAccounts = await identity.getSecondaryAccounts();

  console.log('Signing keys (after removing):');
  secondaryAccounts.data.forEach(({ account }) => {
    console.log(`- Type: Account, Value: ${account.address}`);
  });

  await api.disconnect();
})();
