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
  const issueTokens = async (asset: Asset, amount: number): Promise<void> => {
    const issueTokensProcedure = await asset.issuance.issue({ amount: new BigNumber(amount) });

    const result = await issueTokensProcedure.run();

    console.log(`Tokens issued! ${result}`);
  };

  /**
   * Redeem tokens for Asset
   * @param asset - Asset to issue tokens for
   * @param amount - Amount of tokens to redeem
   **/
  const redeemTokens = async (asset: Asset, amount: number): Promise<void> => {
    const redeemTokensProcedure = await asset.redeem({ amount: new BigNumber(amount) });

    const result = await redeemTokensProcedure.run();

    console.log(`Tokens redeemed! ${result}`);
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

    console.log(`\n➡️ Getting Global Asset Metadata Keys`);

    const asset = await api.assets.getAsset({ ticker });

    switch (action) {
      case SCRIPT_ACTIONS.ISSUE:
        if (!amount) {
          throw new Error('Please supply amount of tokens to issue as an argument to the script');
        }
        await issueTokens(asset, amount);
        break;
      case SCRIPT_ACTIONS.GET_HOLDERS:
        await getHolders(asset);
        break;
      case SCRIPT_ACTIONS.REDEEM:
        if (!amount) {
          throw new Error('Please supply amount of tokens to redeem as an argument to the script');
        }
        await redeemTokens(asset, amount);
        break;
      default:
        break;
    }

    console.log('Disconnecting from the node...\n');

    await api.disconnect();
  };

  runScript();
})();
