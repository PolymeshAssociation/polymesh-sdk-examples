import { AssetTx, PermissionType, TxGroup } from '@polymeshassociation/polymesh-sdk/types';
import P from 'bluebird';

import { getAsset } from '~/common/assets';
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

  const assetInput = process.argv[2];

  if (!assetInput) {
    throw new Error('Please supply a ticker as an argument to the script');
  }

  const asset = await getAsset(api, assetInput);

  const { name } = await asset.details();
  console.log(`Asset found! Current asset name is: ${name}`);

  // Creates a Permission Group

  console.log('Creating group...');
  let newGroup;
  try {
    const createGroupQ = await asset.permissions.createGroup({
      permissions: {
        transactions: {
          values: [AssetTx.Freeze],
          type: PermissionType.Include,
        },
        transactionGroups: [TxGroup.AssetManagement],
      },
    });
    newGroup = await createGroupQ.run();
  } catch {
    const { custom } = await asset.permissions.getGroups();
    newGroup = custom[custom.length - 1];
    console.log('Reusing existing custom permission group');
  }

  // Fetches all Permission Groups

  const { known, custom } = await asset.permissions.getGroups();

  console.log(`\nKnown Permission Groups:\n`);
  await P.each(known, async (knownGroup) => {
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
  });
  console.log('Inviting agent...');
  let inviteResult;
  try {
    inviteResult = await inviteAgentQ.run();
  } catch (error) {
    console.log(`Skipping agent invite (${(error as Error).message})\n`);
  }

  if (inviteResult && 'authId' in inviteResult) {
    console.log(`Authorization created with id ${inviteResult.authId.toString()}`);
    console.log('The target Identity must accept the authorization before becoming an agent');
  }

  // Fetches list of Agents and their respective Permission Groups

  let agents = await asset.permissions.getAgents();
  console.log(`\nAgents and their groups:\n`);
  agents.forEach(({ agent, group }) => {
    console.log(`DID: ${agent.did}`);
    console.log(
      `${'type' in group ? 'Known' : 'Custom'} group: ${'type' in group ? group.type : group.id}`
    );
  });

  // Revokes an Agent's permissions
  const isBobAgent = agents.some(({ agent }) => agent.did === bobIdentity);

  if (isBobAgent) {
    const removeAgentQ = await asset.permissions.removeAgent({
      target: bobIdentity,
    });
    console.log('Revoking agent...');
    await removeAgentQ.run();

    agents = await asset.permissions.getAgents();
    console.log(`\nAgents after revoke:\n`);
    agents.forEach(({ agent, group }) => {
      console.log(`DID: ${agent.did}`);
      console.log(
        `${'type' in group ? 'Known' : 'Custom'} group: ${'type' in group ? group.type : group.id}`
      );
    });
  } else {
    console.log('\nSkipping agent revoke (target is not yet an active agent)\n');
  }

  // Retrieves an Identity's Permission Group for a specific Asset

  const group = await identity.assetPermissions.getGroup({
    asset: asset.id,
  });
  console.log(`${assetInput} - ${'type' in group ? group.type : group.id}`);

  // Assigns an Identity to a different Permission Group

  console.log('Assigning custom permission group...');
  try {
    const setGroupQ = await identity.assetPermissions.setGroup({
      group: newGroup,
    });
    await setGroupQ.run();
  } catch (error) {
    console.log(`Skipping group assignment (${(error as Error).message})\n`);
  }

  // Retrieves all the Assets over which this Identity has permissions

  const permissions = await identity.assetPermissions.get();
  permissions.forEach(({ asset, group }) => {
    console.log(`${asset} - ${'type' in group ? group.type : group.id}`);
  });

  // Checks whether an Identity has specific transaction Permissions

  console.log(
    await identity.assetPermissions.checkPermissions({
      asset: asset.id,
      transactions: [AssetTx.RenameAsset],
    })
  );

  // Abdicates from the current Permissions Group for a given Asset
  // @note waived in this example to avoid removing the signing Identity as an agent
  /*
    const waiveQ = await identity.assetPermissions.waive({
      asset: asset.id,
    });

    console.log('Abdicating...');
    await waiveQ.run();
  */

  await api.disconnect();
})();
