import { Polymesh } from '@polymeshassociation/polymesh-sdk';
import { TxGroup } from '@polymeshassociation/polymesh-sdk/types';

/*
  This script demonstrates secondary key functionality. It:
    - Sends an invitation to an Account to join the signing Identity
    - Accepts the invitation with the target key
    - Queries the signing Identity's signing keys
    - Removes the secondary key
*/
export const manageSecondaryKeys = async (sdk: Polymesh, targetAddress: string): Promise<void> => {
  const identity = await sdk.getSigningIdentity();
  if (!identity) {
    throw new Error('the SDK must have a signing identity');
  }

  // Account to invite to join the signing Identity
  const targetAccount = await sdk.accountManagement.getAccount({
    address: targetAddress,
  });

  const inviteAccountTx = await sdk.accountManagement.inviteAccount({
    targetAccount,
    permissions: {
      portfolios: null,
      // `txGroupToTxTags` can be used to know which TxTags correspond to each group
      transactionGroups: [TxGroup.Issuance, TxGroup.ClaimsManagement],
      assets: null,
    },
  });

  const authRequest = await inviteAccountTx.run();
  // `targetAccount.authorizations.getReceived()` can be called without an ID
  const joinAuth = await targetAccount.authorizations.getOne({ id: authRequest.authId });

  // assumes the SDK has the address loaded into its Signing Manager
  const joinTx = await joinAuth.accept({ signingAccount: targetAddress });
  await joinTx.run();
  const { data: secondaryAccounts } = await identity.getSecondaryAccounts();
  // A secondary key can have its permissions modified
  const modifyPermissionsTx = await sdk.accountManagement.modifyPermissions({
    secondaryAccounts: [
      {
        account: targetAccount,
        permissions: {
          portfolios: null,
        },
      },
    ],
  });
  await modifyPermissionsTx.run();
  // remove a secondary key
  const removeKeysTx = await sdk.accountManagement.removeSecondaryAccounts({
    accounts: [targetAccount],
  });
  await removeKeysTx.run();
};
