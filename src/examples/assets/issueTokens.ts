import { BigNumber } from '@polymeshassociation/polymesh-sdk';

import { getFungibleAsset } from '~/common/assets';
import { getClient } from '~/common/client';
import { parseArgs } from '~/common/utils';

type ScriptArgs = {
  amount?: number;
  asset?: string;
};

/*
  This script showcases how to issue tokens for an Asset.

  Usage e.g: yarn run-example ./src/examples/assets/issueTokens.ts ticker=TICKER amount=1000
*/
(async (): Promise<void> => {
  const { asset: assetInput, amount } = parseArgs<ScriptArgs>(process.argv.slice(2));

  if (!assetInput) {
    throw new Error('Please supply a ticker or Asset ID as an argument to the script');
  }

  if (!amount) {
    throw new Error('Please supply amount of tokens to issue as an argument to the script');
  }

  console.log('Connecting to the node...\n');

  const api = await getClient(process.env.ACCOUNT_SEED);

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const identity = (await api.getSigningIdentity())!;
  console.log(`Connected! Signing Identity ID: ${identity.did}`);

  const asset = await getFungibleAsset(api, assetInput);

  console.log(`Preparing to issue ${amount} of tokens for ${asset.id}`);

  const issueTokensProcedure = await asset.issuance.issue({ amount: new BigNumber(amount) });

  await issueTokensProcedure.run();

  console.log(`TX Status: ${issueTokensProcedure.status}`);
  console.log(`Block Hash: ${issueTokensProcedure.blockHash}`);

  console.log('Disconnecting from the node...\n');

  await api.disconnect();
})();
