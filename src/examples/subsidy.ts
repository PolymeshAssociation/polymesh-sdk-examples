import { BigNumber } from '@polymeshassociation/polymesh-sdk';

import { getClient } from '~/common/client';
import { parseArgs } from '~/common/utils';

type ScriptArgs = {
  account: string;
};

/*
  This script showcases how to interact with Subsidy, it
  - grants a subsidy to an account
  - increases allowance
  - decreases allowance
  - sets allowance
  - quits subsidy

  Usage e.g: yarn run-example ./src/examples/subsidy.ts account=ACCOUNT_ADDRESS
*/
(async (): Promise<void> => {
  const { account: beneficiary } = parseArgs<ScriptArgs>(process.argv.slice(2));

  if (!beneficiary) {
    throw new Error('Please supply an account as an argument to the script');
  }

  console.log('Connecting to the node...\n');

  const api = await getClient(process.env.ACCOUNT_SEED);

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const identity = (await api.getSigningIdentity())!;
  console.log(`Connected! Signing Identity ID: ${identity.did}`);

  // get subsidizer account
  const { account: subsidizer } = await identity.getPrimaryAccount();

  try {
    const approveSubsidyQ = await api.accountManagement.approveSubsidy({
      beneficiary,
      allowance: new BigNumber(1000),
    });
    await approveSubsidyQ.run();
    console.log('Subsidy request has been approved and awaits acceptance by the beneficiary');
  } catch (error) {
    console.log(`Skipping approve subsidy (${(error as Error).message})`);
  }

  // beneficiary now has to accept the subsidy request
  const beneficiaryApi = await getClient(process.env.BOB_SEED);
  const beneficiaryAccount = (await beneficiaryApi.accountManagement.getSigningAccount())!;

  const pendingSubsidies = await beneficiaryAccount.subsidies.getPendingSubsidies();
  console.log(`Pending subsidies for beneficiary: ${pendingSubsidies.length}`);

  try {
    const acceptSubsidyQ = await beneficiaryApi.accountManagement.acceptSubsidy({
      subsidizer,
    });
    await acceptSubsidyQ.run();
    console.log('Subsidy request has been accepted by the beneficiary');
  } catch (error) {
    console.log(`Skipping accept subsidy (${(error as Error).message})`);
  }

  // get subsidy
  const subsidy = api.accountManagement.getSubsidy({ subsidizer, beneficiary });
  const subsidyExists = await subsidy.exists();

  if (!subsidyExists) {
    console.log('No active subsidy — skipping allowance management');
    await api.disconnect();
    return;
  }

  // get allowance
  let allowance = await subsidy.getAllowance();
  console.log(`Allowance before increase is: ${allowance}`);

  // add allowance
  const addAllowanceQ = await subsidy.increaseAllowance({ allowance: new BigNumber(1000) });
  await addAllowanceQ.run();

  allowance = await subsidy.getAllowance();
  console.log(`Allowance after increase is: ${allowance}`);

  // remove allowance
  const removeAllowanceQ = await subsidy.decreaseAllowance({ allowance: new BigNumber(1000) });
  await removeAllowanceQ.run();

  allowance = await subsidy.getAllowance();
  console.log(`Allowance after decrease is: ${allowance}`);

  // set allowance
  const setAllowanceQ = await subsidy.setAllowance({ allowance: new BigNumber(5000) });
  await setAllowanceQ.run();

  allowance = await subsidy.getAllowance();
  console.log(`Allowance after setting is: ${allowance}`);

  // quit subsidy
  const quitSubsidyQ = await subsidy.quit();
  await quitSubsidyQ.run();

  // check if subsidy is still active
  const subsidyStillExists = await subsidy.exists();
  console.log(`Is subsidy still active: ${subsidyStillExists}`);

  console.log('Disconnecting from the node...\n');
  await api.disconnect();
})();
