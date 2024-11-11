import { FungibleAsset, ModuleName, PermissionType } from '@polymeshassociation/polymesh-sdk/types';

import { getClient } from '~/common/client';
import { isAssetId } from '~/common/utils';

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

  const assetInput = process.argv[2];

  if (!assetInput) {
    throw new Error('Please supply a ticker or Asset ID as an argument to the script');
  }

  let asset: FungibleAsset;
  if (isAssetId(assetInput)) {
    asset = await api.assets.getFungibleAsset({ assetId: assetInput });
  } else {
    asset = await api.assets.getFungibleAsset({ ticker: assetInput });
  }
  const corporateActionAgents = await asset.corporateActions.getAgents();

  if (corporateActionAgents.length) {
    console.log('Corporate Action Agents:');
    corporateActionAgents.forEach(({ did }) => {
      console.log(`- DID: ${did}`);
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const bobDid = process.env.BOB_DID!;
  const target = await api.identities.getIdentity({
    did: bobDid,
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
