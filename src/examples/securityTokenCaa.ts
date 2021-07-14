import { getClient } from '~/common/client';

/* 
  This script demonstrates Security Token CAA functionality. It:
    - Queries the current CAA
    - Assigns a new CAA
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
  const corporateActionAgents = await token.corporateActions.getAgents();

  if (corporateActionAgents.length) {
    console.log('Corporate Action Agents:');
    corporateActionAgents.forEach(({ did }) => {
      console.log(`- DID: ${did}`);
    });
  }

  const setCorporateActionsAgent = await token.corporateActions.setAgent({
    target: api.getIdentity({
      did: '0x1906c0a0f58364d3f71c4e94e1361af9810666445564840c96f9f1a965cf6045',
    }),
  });

  console.log('Assigning a new corporate actions agent for the Security Token...');
  await setCorporateActionsAgent.run();

  await api.disconnect();
})();
