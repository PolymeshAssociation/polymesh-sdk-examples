import { AssetTx, PermissionType, TxGroup } from '@polymathnetwork/polymesh-sdk/types';
import P from 'bluebird';

import { getClient } from '~/common/client';

/*
  This script showcases External Agents related functionality. It:
    - Creates a Permission Group
    - Fetches all Permission Groups
    - Invites an Identity to be an Agent
    - Fetches list of Agents and their respective Permission Groups
    - Revokes an Agent's permissions
    - Retrieves all the Assets over which an Identity has permissions
    - Checks whether an Identity has specific transaction Permissions
    - Retrieves an Identity's Permission Group
    - Abdicates from the current Permissions Group
    - Assigns an Identity to a different Permission Group
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
  const { name } = await asset.details();
  console.log(`Asset found! Current asset name is: ${name}`);

  // Creates a Permission Group

  const createGroupQ = await asset.permissions.createGroup({
    permissions: {
      transactions: {
        values: [AssetTx.Freeze],
        type: PermissionType.Include,
      },
      transactionGroups: [TxGroup.PortfolioManagement],
    },
    // permissions: {
    //   transactions: {
    //     values: [ModuleName.Asset],
    //     type: PermissionType.Include,
    //     exceptions: [AssetTx.Freeze],
    //   },
    //   transactionGroups: [TxGroup.PortfolioManagement],
    // },
    // permissions: {
    //   transactions: {
    //     values: [ModuleName.Asset],
    //     type: PermissionType.Exclude,
    //     exceptions: [AssetTx.Freeze],
    //   },
    // },
  });
  console.log('Creating group...');
  const newGroup = await createGroupQ.run();

  // Fetches all Permission Groups

  const { known, custom } = await asset.permissions.getGroups();

  console.log(`\nKnown Permission Groups:\n`);
  await P.each(known, async knownGroup => {
    const { transactions, transactionGroups } = await knownGroup.getPermissions();
    console.log(`[${knownGroup.type} Group]`);
    console.log(`Transactions values: ${transactions ? transactions.values : 'ALL'}`);
    console.log(`Transactions type: ${transactions ? transactions.type : '-'}`);
    console.log(`Transactions exceptions: ${transactions ? transactions.exceptions : '-'}`);
    console.log(`Transactions groups: ${transactionGroups.length ? transactionGroups : '-'}\n`);
  });

  console.log(`\nCustom Permission Groups:\n`);
  await P.each(custom, async (customGroup, i) => {
    const { transactions, transactionGroups } = await customGroup.getPermissions();
    console.log(`[Custom Group #${i}]`);
    console.log(`Transactions values: ${transactions ? transactions.values : 'ALL'}`);
    console.log(`Transactions type: ${transactions ? transactions.type : '-'}`);
    console.log(`Transactions exceptions: ${transactions ? transactions.exceptions : '-'}`);
    console.log(`Transactions groups: ${transactionGroups.length ? transactionGroups : '-'}\n`);
  });

  // Invites an Identity to be an Agent

  /**
   * @note this may create an Authorization Requests which have to be accepted by
   *   the corresponding target. An Identity can
   *   fetch its pending Authorization Requests by calling `authorizations.getReceived`
   */
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const bobIdentity = process.env.BOB_DID!;
  const inviteAgentQ = await asset.permissions.inviteAgent({
    target: bobIdentity,
    permissions: newGroup,
    // permissions: {
    //   transactions: {
    //     values: [AssetTx.Transfer],
    //     type: PermissionType.Include
    //   },
    //   transactionGroups: [TxGroup.PortfolioManagement]
    // }
  });
  console.log('Inviting agent...');
  await inviteAgentQ.run();

  // Fetches list of Agents and their respective Permission Groups

  const agents = await asset.permissions.getAgents();
  console.log(`\nAgents and their groups:\n`);
  agents.forEach(({ agent, group }) => {
    console.log(`DID: ${agent.did}`);
    console.log(
      `${'type' in group ? 'Known' : 'Custom'} group: ${'type' in group ? group.type : group.id}`
    );
  });

  // Revokes an Agent's permissions
  const removeAgentQ = await asset.permissions.removeAgent({
    target: bobIdentity,
  });
  console.log('Revoking agent...');
  await removeAgentQ.run();

  // Retrieves an Identity's Permission Group for a specific Asset

  const group = await identity.assetPermissions.getGroup({
    asset: ticker,
  });
  console.log(`${ticker} - ${'type' in group ? group.type : group.id}`);

  // Assigns an Identity to a different Permission Group

  const setGroupQ = await identity.assetPermissions.setGroup({
    group,
  });
  console.log('Assigning...');
  await setGroupQ.run();

  // Retrieves all the Assets over which this Identity has permissions

  const permissions = await identity.assetPermissions.get();
  permissions.map(({ asset, group }) => {
    console.log(`${asset} - ${'type' in group ? group.type : group.id}`);
  });

  // Checks whether an Identity has specific transaction Permissions

  console.log(
    await identity.assetPermissions.checkPermissions({
      asset: ticker,
      transactions: [AssetTx.RenameAsset],
    })
  );

  // Abdicates from the current Permissions Group for a given Asset

  const waiveQ = await identity.assetPermissions.waive({
    asset: ticker,
  });

  console.log('Abdicating...');
  await waiveQ.run();

  await api.disconnect();
})();
