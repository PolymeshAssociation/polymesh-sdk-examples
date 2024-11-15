import { PermissionGroupType } from '@polymeshassociation/polymesh-sdk/types';

import { getAsset } from '~/common/assets';
import { getClient } from '~/common/client';

/*
  This script demonstrates Asset PIA functionality. It:
    - Queries the current PIA
    - Invites a new Agent 
*/
(async (): Promise<void> => {
  console.log('Connecting to the node...\n\n');
  const api = await getClient(process.env.ACCOUNT_SEED);

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const identity = (await api.getSigningIdentity())!;
  console.log(`Connected! Signing Identity ID: ${identity.did}`);

  const assetInput = process.argv[2];

  if (!assetInput) {
    throw new Error('Please supply a ticker or Asset ID as an argument to the script');
  }

  const asset = await getAsset(api, assetInput);
  const { fullAgents } = await asset.details();

  if (fullAgents.length) {
    console.log('Agents:');
    fullAgents.forEach(({ did }) => {
      console.log(`- DID: ${did}`);
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const bobDid = process.env.BOB_DID!;
  const target = await api.identities.getIdentity({
    did: bobDid,
  });

  console.log(`Fetching permissions group of type - ${PermissionGroupType.Full}`);
  const fullPermissions = await asset.permissions.getGroup({ type: PermissionGroupType.Full });

  console.log(fullPermissions.toHuman());

  const invitingFullAgentTx = await asset.permissions.inviteAgent({
    target,
    permissions: fullPermissions,
  });

  console.log('Inviting a new agent for the Asset with full permissions...');
  const authRequest = await invitingFullAgentTx.run();

  console.log(`Authorization added with id ${authRequest.authId.toString()}`);

  await api.disconnect();
})();
