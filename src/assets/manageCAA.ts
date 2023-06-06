import { Polymesh } from '@polymeshassociation/polymesh-sdk';
import { ModuleName, PermissionType } from '@polymeshassociation/polymesh-sdk/types';

/*
  This script demonstrates Asset Corporate Action Agent (CAA) functionality. It:
    - Assigns a new CAA
    - Find and Accept the authorization to become CAA
    - Queries the current CAA
*/
export const manageCAA = async (
  sdk: Polymesh,
  targetDid: string,
  ticker: string
): Promise<void> => {
  const [identity, target] = await Promise.all([
    sdk.getSigningIdentity(),
    sdk.identities.getIdentity({ did: targetDid }),
  ]);
  if (!identity) {
    throw new Error('The SDK must have a signing identity');
  }

  const asset = await sdk.assets.getAsset({ ticker });

  const setCorporateActionsAgentTx = await asset.permissions.inviteAgent({
    target,
    permissions: {
      transactions: {
        values: [
          ModuleName.CapitalDistribution,
          ModuleName.CorporateAction,
          ModuleName.CorporateBallot,
        ],
        type: PermissionType.Include,
      },
    },
  });

  const authRequest = await setCorporateActionsAgentTx.run();
  const pendingAuthorizations = await target.authorizations.getReceived({ includeExpired: false });
  const becomeCAAAuth = pendingAuthorizations.find(({ authId }) => authId.eq(authRequest.authId));
  if (!becomeCAAAuth) {
    throw new Error('The CAA auth should be findable');
  }

  const { account: targetAccount } = await target.getPrimaryAccount();

  const becomeCAATx = await becomeCAAAuth.accept({ signingAccount: targetAccount });
  await becomeCAATx.run();
  // fetch an assets CAAs
  const corporateActionAgents = await asset.corporateActions.getAgents();
};
