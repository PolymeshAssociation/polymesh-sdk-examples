import { getClient } from '~/common/client';

/* 
  This script retrieves the balance of a specific asset
    held by the current identity
*/
(async (): Promise<void> => {
  console.log('Connecting to the node...\n\n');
  const api = await getClient(process.env.ACCOUNT_SEED);

  const ticker = process.argv[2];

  if (!ticker) {
    throw new Error('Please supply a ticker as an argument to the script');
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const identity = (await api.getCurrentIdentity())!;
  console.log(`Connected! Current identity ID: ${identity.did}`);

  const balance = await identity.getTokenBalance({ ticker });

  console.log(`Balance of "${ticker}" is ${balance.toFormat()}`);
})();
