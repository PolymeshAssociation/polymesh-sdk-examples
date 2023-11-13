import { getClient } from '~/common/client';
import { parseArgs } from '~/common/utils';

/*
  This script showcases how get list of Asset holders.

  Usage e.g: yarn run-example ./src/examples/assets/getHolders.ts ticker=TICKER
*/
(async (): Promise<void> => {
  const { ticker } = parseArgs<ScriptArgs>(process.argv.slice(2));

  if (!ticker) {
    throw new Error('Please supply a ticker as an argument to the script');
  }

  console.log('Connecting to the node...\n');

  const api = await getClient(process.env.ACCOUNT_SEED);

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const identity = (await api.getSigningIdentity())!;
  console.log(`Connected! Signing Identity ID: ${identity.did}`);

  const asset = await api.assets.getFungibleAsset({ ticker });

  console.log(`Preparing to list token holders for ${ticker}`);

  const { data } = await asset.assetHolders.get();

  console.log(`Holders of ${ticker}: \n`);

  data.forEach(({ identity, balance }) => {
    console.log(`- Identity: ${identity.did}, Balance: ${balance.toFormat()}`);
  });

  console.log('Disconnecting from the node...\n');

  await api.disconnect();
})();

type ScriptArgs = {
  ticker?: string;
};
