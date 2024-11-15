import { getFungibleAsset } from '~/common/assets';
import { getClient } from '~/common/client';
import { parseArgs } from '~/common/utils';

type ScriptArgs = {
  asset?: string;
};

/*
  This script showcases how get list of Asset holders.

  Usage e.g: yarn run-example ./src/examples/assets/getHolders.ts ticker=TICKER
*/
(async (): Promise<void> => {
  const { asset: assetInput } = parseArgs<ScriptArgs>(process.argv.slice(2));

  if (!assetInput) {
    throw new Error('Please supply a ticker or Asset ID as an argument to the script');
  }

  console.log('Connecting to the node...\n');

  const api = await getClient(process.env.ACCOUNT_SEED);

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const identity = (await api.getSigningIdentity())!;
  console.log(`Connected! Signing Identity ID: ${identity.did}`);

  const asset = await getFungibleAsset(api, assetInput);

  console.log(`Preparing to list token holders for ${asset.id}`);

  const { data } = await asset.assetHolders.get();

  console.log(`Holders of ${asset.id}: \n`);

  data.forEach(({ identity, balance }) => {
    console.log(`- Identity: ${identity.did}, Balance: ${balance.toFormat()}`);
  });

  console.log('Disconnecting from the node...\n');

  await api.disconnect();
})();
