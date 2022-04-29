import { ModuleName, PermissionType } from '@polymathnetwork/polymesh-sdk/types';

import { getClient } from '~/common/client';

/* 
  This script demonstrates Asset CAA functionality. It:
    - Queries the current CAA
    - Assigns a new CAA
*/
(async (): Promise<void> => {
  console.log('Connecting to the node...\n\n');
  const api = await getClient(process.env.ACCOUNT_SEED);

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const identity = (await api.getSigningIdentity())!;
  console.log(`Connected! Signing Identity ID: ${identity.did}`);

  const ticker = process.argv[2];

  if (!ticker) {
    throw new Error('Please supply a ticker as an argument to the script');
  }

  const asset = await api.assets.getAsset({ ticker });
  const corporateActionAgents = await asset.corporateActions.getAgents();

  if (corporateActionAgents.length) {
    console.log('Corporate Action Agents:');
    corporateActionAgents.forEach(({ did }) => {
      console.log(`- DID: ${did}`);
    });
  }

  const target = await api.identities.getIdentity({
    did: '0x1906c0a0f58364d3f71c4e94e1361af9810666445564840c96f9f1a965cf6045',
  });

  const setCorporateActionsAgent = await asset.permissions.inviteAgent({
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

  console.log('Assigning a new corporate actions agent for the Asset...');
  await setCorporateActionsAgent.run();

  await api.disconnect();
})();
