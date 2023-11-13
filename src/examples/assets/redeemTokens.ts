import { BigNumber } from '@polymeshassociation/polymesh-sdk';

import { getClient } from '~/common/client';
import { parseArgs } from '~/common/utils';

type ScriptArgs = {
  amount?: number;
  ticker?: string;
};

/*
  This script showcases how to redeem tokens for an Asset.

  Usage e.g: yarn run-example ./src/examples/assets/redeemTokens.ts ticker=TICKER amount=1000
*/
(async (): Promise<void> => {
  const { ticker, amount } = parseArgs<ScriptArgs>(process.argv.slice(2));

  if (!ticker) {
    throw new Error('Please supply a ticker as an argument to the script');
  }

  if (!amount) {
    throw new Error('Please supply amount of tokens to redeem as an argument to the script');
  }

  console.log('Connecting to the node...\n');

  const api = await getClient(process.env.ACCOUNT_SEED);

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const identity = (await api.getSigningIdentity())!;
  console.log(`Connected! Signing Identity ID: ${identity.did}`);

  const asset = await api.assets.getFungibleAsset({ ticker });

  console.log(`Preparing to redeem ${amount} of tokens for ${ticker}`);

  const redeemTokensProcedure = await asset.redeem({ amount: new BigNumber(amount) });

  await redeemTokensProcedure.run();

  console.log(`TX Status: ${redeemTokensProcedure.status}`);
  console.log(`Block Hash: ${redeemTokensProcedure.blockHash}`);

  console.log('Disconnecting from the node...\n');

  await api.disconnect();
})();
