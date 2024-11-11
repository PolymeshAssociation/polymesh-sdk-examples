import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { Identity } from '@polymeshassociation/polymesh-sdk/types';

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

  // granting a subsidy to beneficiary
  const subsidyGrantQ = await api.accountManagement.subsidizeAccount({
    beneficiary,
    allowance: new BigNumber(1000),
  });
  const subsidyGrantResult = await subsidyGrantQ.run();

  console.log(`Subsidy request has been created and will expire in ${subsidyGrantResult.expiry}`);

  // beneficiary now has to accept the subsidy request
  // it is possible to run accept method on `subsidyGrantResult` however, it is more realistic to store the `authId` and then ask the beneficiary to accept the subsidy
  const beneficiaryApi = await getClient(process.env.BOB_SEED);
  // on the beneficiary's side we need to get the signing identity to be able to accept the subsidy with beneficiary signature
  const beneficiaryIdentity = (await beneficiaryApi.getSigningIdentity()) as Identity;

  const authorization = await beneficiaryIdentity.authorizations.getOne({
    id: subsidyGrantResult.authId,
  });
  const acceptTx = await authorization.accept();

  console.log(
    `Subsidy request has been accepted by the beneficiary. Transaction status: ${acceptTx.status}`
  );

  // get subsidy
  const subsidy = api.accountManagement.getSubsidy({ subsidizer, beneficiary });

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
  const subsidyExists = await subsidy.exists();
  console.log(`Is subsidy still active: ${subsidyExists}`);

  console.log('Disconnecting from the node...\n');
  await api.disconnect();
})();
