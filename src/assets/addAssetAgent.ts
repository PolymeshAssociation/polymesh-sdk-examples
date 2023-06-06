import { Polymesh } from '@polymeshassociation/polymesh-sdk';
import { PermissionGroupType } from '@polymeshassociation/polymesh-sdk/types';

/*
  This script demonstrates Asset PIA functionality. It:
    - Queries the current PIA
    - Invites a new Agent
*/
export const addAssetAgent = async (
  sdk: Polymesh,
  targetDid: string,
  ticker: string
): Promise<void> => {
  const signingIdentity = await sdk.getSigningIdentity();
  if (!signingIdentity) {
    throw new Error('The SDK does not have a signing identity');
  }

  const target = await sdk.identities.getIdentity({
    did: targetDid,
  });
  const { account: targetAccount } = await target.getPrimaryAccount();

  const asset = await sdk.assets.getAsset({ ticker });

  // Fetch full agents of the Asset
  const { fullAgents } = await asset.details();
  // Note, custom permission groups can be made to limit the actions of particular agents
  const fullPermissions = await asset.permissions.getGroup({ type: PermissionGroupType.Full });

  const invitingFullAgentTx = await asset.permissions.inviteAgent({
    target,
    permissions: fullPermissions,
  });
  const authRequest = await invitingFullAgentTx.run();
  // prepare and accept becoming an agent
  const acceptAgentTx = await authRequest.accept({ signingAccount: targetAccount });
  await acceptAgentTx.run();
};
