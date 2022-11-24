import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { Asset } from '@polymeshassociation/polymesh-sdk/types';

import { getClient } from '~/common/client';
import { parseArgs } from '~/common/utils';

enum SCRIPT_ACTIONS {
  ISSUE = 'issue',
  REDEEM = 'redeem',
  GET_HOLDERS = 'getHolders',
}

type ScriptArgs = {
  amount?: number;
  ticker?: string;
  action?: SCRIPT_ACTIONS;
};

/* 
  This script showcases Asset Issuance related functionality.It:
    - Issues new tokens
    - Get all asset holders
    - Redeems tokens

  Usage: yarn run-example ./src/examples/assetIssuance.ts ticker=<TICKER> action=<ACTION> amount=<INTEGER>
*/
(async (): Promise<void> => {
  /**
   * Get Token holders
   * @param asset - Asset to get holders for
   **/
  const getHolders = async (asset: Asset): Promise<void> => {
    const { data } = await asset.assetHolders.get();

    console.log(`Holders of ${asset.ticker}: \n`);

    data.forEach(({ identity, balance }) => {
      console.log(`- Identity: ${identity.did}, Balance: ${balance.toFormat()}`);
    });
  };

  /**
   * Issue tokens for Asset
   * @param asset - Asset to issue tokens for
   * @param amount - Amount of tokens to issue
   **/
  const issueTokens = async (asset: Asset, amount?: number): Promise<void> => {
    if (!amount) {
      throw new Error('Please supply amount of tokens to issue as an argument to the script');
    }

    console.log(`Preparing to issue ${amount} of tokens for ${asset.ticker}`);

    const issueTokensProcedure = await asset.issuance.issue({ amount: new BigNumber(amount) });

    await issueTokensProcedure.run();

    console.log(`TX Status: ${issueTokensProcedure.status}`);
    console.log(`Block Hash: ${issueTokensProcedure.blockHash}`);
  };

  /**
   * Redeem tokens for Asset
   * @param asset - Asset to issue tokens for
   * @param amount - Amount of tokens to redeem
   **/
  const redeemTokens = async (asset: Asset, amount?: number): Promise<void> => {
    if (!amount) {
      throw new Error('Please supply amount of tokens to redeem as an argument to the script');
    }

    console.log(`Preparing to redeem ${amount} of tokens for ${asset.ticker}`);

    const redeemTokensProcedure = await asset.redeem({ amount: new BigNumber(amount) });

    await redeemTokensProcedure.run();

    console.log(`TX Status: ${redeemTokensProcedure.status}`);
    console.log(`Block Hash: ${redeemTokensProcedure.blockHash}`);
  };

  /**
   * execute the script
   **/
  const runScript = async (): Promise<void> => {
    const { ticker, amount, action } = parseArgs<ScriptArgs>(process.argv.slice(2));

    if (!action || !Object.values(SCRIPT_ACTIONS).includes(action)) {
      throw new Error('Please supply a valid action as an argument to the script');
    }

    if (!ticker) {
      throw new Error('Please supply a ticker as an argument to the script');
    }

    console.log('Connecting to the node...\n');
    const api = await getClient(process.env.ACCOUNT_SEED);

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const identity = (await api.getSigningIdentity())!;
    console.log(`Connected! Signing Identity ID: ${identity.did}`);

    const asset = await api.assets.getAsset({ ticker });

    if (action === SCRIPT_ACTIONS.ISSUE) {
      await issueTokens(asset, amount);
    }

    if (action === SCRIPT_ACTIONS.GET_HOLDERS) {
      await getHolders(asset);
    }

    if (action === SCRIPT_ACTIONS.REDEEM) {
      await redeemTokens(asset, amount);
    }

    console.log('Disconnecting from the node...\n');

    await api.disconnect();
  };

  await runScript();
})();
