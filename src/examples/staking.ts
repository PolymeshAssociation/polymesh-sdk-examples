import { BigNumber } from '@polymeshassociation/polymesh-sdk';

import { getClient } from '~/common/client';

/*
  This script demonstrates Staking functionality. It:
    - Gets staking info
    - Bonds POLYX
    - Nominates validators
    - Unbonds POLYX
    - Withdraws POLYX
    - Sets payee
    - Sets controller
*/
(async (): Promise<void> => {
  console.log('Connecting to the node...\n\n');
  const api = await getClient(process.env.ACCOUNT_SEED);

  const signingIdentity = await api.getSigningIdentity();
  if (!signingIdentity) {
    throw new Error('no signing identity was found');
  }

  const [signingAccount] = await api.accountManagement.getSigningAccounts();

  const eraInfo = await api.staking.eraInfo();
  console.log('Received era info: ', JSON.stringify(eraInfo));

  console.log('Bonding polyx');
  try {
    const bondTx = await api.staking.bond(
      {
        amount: new BigNumber(10),
        controller: signingAccount,
        payee: signingAccount,
        autoStake: true, // when payee is the stash, this can be set to auto compound rewards
      },
      { signingAccount }
    );
    await bondTx.run();
  } catch (error) {
    console.log(`Skipping bond (${(error as Error).message})`);
  }

  const { data: validators } = await api.staking.getValidators();
  console.log(
    'got validators: ',
    validators.map((v) => `Address: ${v.account.address} - Commission: ${v.commission}`).join('\n')
  );

  const validatorAccount = validators[0].account;

  try {
    const nominate = await api.staking.nominate(
      { validators: [validatorAccount] },
      { signingAccount }
    );
    await nominate.run();
    console.log('nominated validators');
  } catch (error) {
    console.log(`Skipping nominate (${(error as Error).message})`);
  }

  try {
    const unbond = await api.staking.unbond({ amount: new BigNumber(3) }, { signingAccount });
    await unbond.run();
  } catch (error) {
    console.log(`Skipping unbond (${(error as Error).message})`);
  }

  try {
    const setPayee = await api.staking.setPayee(
      { payee: signingAccount, autoStake: false },
      { signingAccount }
    );
    await setPayee.run();
    console.log('auto stake has been unset');
  } catch (error) {
    console.log(`Skipping set payee (${(error as Error).message})`);
  }

  try {
    const setController = await api.staking.setController(
      { controller: validatorAccount }, // Note: this should only be an account you control
      { signingAccount }
    );
    await setController.run();
    console.log('new controller was set');
  } catch (error) {
    console.log(`Skipping set controller (${(error as Error).message})`);
  }

  await api.disconnect();
  console.log('Disconnected');
})();
