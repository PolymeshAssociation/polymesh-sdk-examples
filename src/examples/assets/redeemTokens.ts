import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { FungibleAsset } from '@polymeshassociation/polymesh-sdk/types';

import { getClient } from '~/common/client';
import { isAssetId, parseArgs } from '~/common/utils';

type ScriptArgs = {
  amount?: number;
  asset?: string;
};

/*
  This script showcases how to redeem tokens for an Asset.

  Usage e.g: yarn run-example ./src/examples/assets/redeemTokens.ts ticker=TICKER amount=1000
*/
(async (): Promise<void> => {
  const { asset: assetInput, amount } = parseArgs<ScriptArgs>(process.argv.slice(2));

  if (!assetInput) {
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

  let asset: FungibleAsset;

  if (isAssetId(assetInput)) {
    asset = await api.assets.getFungibleAsset({ assetId: assetInput });
  } else {
    asset = await api.assets.getFungibleAsset({ ticker: assetInput });
  }

  console.log(`Preparing to redeem ${amount} of tokens for ${asset.id}`);

  const redeemTokensProcedure = await asset.redeem({ amount: new BigNumber(amount) });

  await redeemTokensProcedure.run();

  console.log(`TX Status: ${redeemTokensProcedure.status}`);
  console.log(`Block Hash: ${redeemTokensProcedure.blockHash}`);

  console.log('Disconnecting from the node...\n');

  await api.disconnect();
})();
