import { AssetTx } from '@polymathnetwork/polymesh-sdk/polkadot/types';
import { PermissionType, TxGroup } from '@polymathnetwork/polymesh-sdk/types';
import P from 'bluebird';

import { getClient } from '~/common/client';

/* 
  This script showcases External Agents related functonality. It:
    - Creates a Permission Group    
    - Fetches all Permission Groups
    - Invites an Identity to be an Agent 
    - Fetches list of Agents and their respective Permission Groups
    - Revokes an Agent's permissions
    - Retrieves all the Security Tokens over which an Identity has permissions
    - Checks whether an Identity has specific transaction Permissions
    - Retrieves an Identity's Permission Group
    - Abdicates from the current Permissions Group
    - Assigns an Identity to a different Permission Group
*/
(async (): Promise<void> => {
  console.log('Connecting to the node...\n\n');
  const api = await getClient(process.env.ACCOUNT_SEED);

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const identity = (await api.getCurrentIdentity())!;
  console.log(`Connected! Current identity ID: ${identity.did}`);

  const ticker = process.argv[2];

  if (!ticker) {
    throw new Error('Please supply a ticker as an argument to the script');
  }

  const token = await api.getSecurityToken({ ticker });
  const { name } = await token.details();
  console.log(`Security Token found! Current token name is: ${name}`);

  // Creates a Permission Group

  const createGroupQ = await token.permissions.createGroup({
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
    //     exceptions: [AssetTx.Freeze]
    //   },
    //   transactionGroups: [TxGroup.PortfolioManagement]
    // }
    // permissions: {
    //   transactions: {
    //     values: [ModuleName.Asset],
    //     type: PermissionType.Exclude,
    //     exceptions: [AssetTx.Freeze]
    //   }
    // }
  });
  console.log('Creating group...');
  const newGroup = await createGroupQ.run();

  // Fetches all Permission Groups

  const { known, custom } = await token.permissions.getGroups();

  console.log(`\nKnown Permission Groups:\n`);
  await P.each(known, async knwonGroup => {
    const { transactions, transactionGroups } = await knwonGroup.getPermissions();
    console.log(`[${knwonGroup.type} Group]`);
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
  const bobIdentity = '0x123';
  const inviteAgentQ = await token.permissions.inviteAgent({
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

  const agents = await token.permissions.getAgents();
  console.log(`\nAgents and their groups:\n`);
  agents.forEach(({ agent, group }) => {
    console.log(`DID: ${agent.did}`);
    console.log(
      `${'type' in group ? 'Known' : 'Custom'} group: ${'type' in group ? group.type : group.id}`
    );
  });

  // Revokes an Agent's permissions

  const removeAgentQ = await token.permissions.removeAgent({
    target: bobIdentity,
  });
  console.log('Revoking agent...');
  await removeAgentQ.run();

  // Retrieves an Identity's Permission Group for a specific Security Token

  const group = await identity.tokenPermissions.getGroup({
    token: 'FAKETOKEN',
  });
  console.log(`FAKETOKEN - ${'type' in group ? group.type : group.id}`);

  // Assigns an Identity to a different Permission Group

  const setGroupQ = await identity.tokenPermissions.setGroup({
    group,
  });
  console.log('Assigning...');
  await setGroupQ.run();

  // Retrieves all the Security Tokens over which this Identity has permissions

  const permissions = await identity.tokenPermissions.get();
  permissions.map(({ token, group }) => {
    console.log(`${token} - ${'type' in group ? group.type : group.id}`);
  });

  // Checks whether an Identity has specific transaction Permissions

  console.log(
    await identity.tokenPermissions.hasPermissions({
      token: 'FAKETOKEN',
      transactions: [AssetTx.Transfer],
    })
  );

  // Abdicates from the current Permissions Group for a given Security Token

  const waiveQ = await identity.tokenPermissions.waive({
    token: 'FAKETOKEN',
  });
  console.log('Abdicating...');
  await waiveQ.run();

  await api.disconnect();
})();
