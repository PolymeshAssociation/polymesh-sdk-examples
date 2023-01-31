import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { Identity } from '@polymeshassociation/polymesh-sdk/types';

import { getClient } from '~/common/client';
import { parseArgs } from '~/common/utils';

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

  // granting a subsidy to beneficary
  const subsidyGrantQ = await api.accountManagement.subsidizeAccount({
    beneficiary,
    allowance: new BigNumber(1000),
  });
  const subsidyGrantResult = await subsidyGrantQ.run();

  console.log(`Subsidy request has been created and will expire in ${subsidyGrantResult.expiry}`);

  // beneficiary now has to accept the subsidy request
  // Here as example we use BOB_SEED as the account that would accept the subsidy, in real life this would be signed by the beneficiary
  const beneficiaryApi = await getClient(process.env.BOB_SEED);

  const beneficiaryIdentity = (await beneficiaryApi.getSigningIdentity()) as Identity;

  const { pending } = await beneficiaryIdentity.getInstructions();

  if (pending.length > 0) {
    const acceptSubsidyQ = await pending[0].affirm();
    await acceptSubsidyQ.run();
  }

  // get subsidy
  const subsidy = await api.accountManagement.getSubsidy({ subsidizer, beneficiary });

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

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  console.log('Disconnecting from the node...\n');
})();

type ScriptArgs = {
  account?: string;
};
