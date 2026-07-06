import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { Asset, PortfolioBalance } from '@polymeshassociation/polymesh-sdk/types';

import { getClient } from '~/common/client';

/*
  This script showcases Portfolio related functionality. It:
    - Creates a Portfolio
    - Renames a Portfolio
    - Fetches an Identity's Portfolios
    - Fetches a Portfolio's Balances
    - Moves tokens between Portfolios
    - Redeems tokens from Portfolio
    - Deletes a Portfolio
*/
(async (): Promise<void> => {
  /**
   * helper function for printing portfolio balance
   **/
  const printBalance = (
    balances: PortfolioBalance[],
    portfolioName: string,
    after?: boolean
  ): void => {
    console.log(
      `\n Balance in ${portfolioName} Portfolio ${after ? 'after' : 'before'} moving assets`
    );

    balances.forEach(({ asset, total, locked }) => {
      console.log(
        `Balance of Asset asset ${
          asset.id
        }:\n- Total: ${total.toFormat()}\n- Locked: ${locked.toFormat()}`
      );
    });
  };

  console.log('Connecting to the node...\n\n');
  const api = await getClient(process.env.ACCOUNT_SEED);

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const identity = (await api.getSigningIdentity())!;
  console.log(`Connected! Signing Identity ID: ${identity.did}`);

  // amount of tokens that will be issuing, moving between portfolios and redeeming
  const amount = new BigNumber(500);
  // ticker for Asset that will be moved between portfolios
  const assetInput = process.argv[2] ?? `TOKEN_${Date.now().toString().slice(-6)}`;

  // setup for issuing tokens - an asset needs to be present on the chain
  let asset: Asset;

  try {
    asset = await api.assets.getFungibleAsset({ assetId: assetInput });
  } catch {
    try {
      asset = await api.assets.getFungibleAsset({ ticker: assetInput });
    } catch {
      const assetQ = await api.assets.createAsset({
        ticker: assetInput.length > 12 ? `T${Date.now().toString().slice(-8)}` : assetInput,
        name: 'Token One',
        isDivisible: true,
        assetType: 'share',
      });
      asset = await assetQ.run();
    }
  }

  // issue tokens to the asset - will be placed in the default Portfolio
  const issueTokensQ = await asset.issuance.issue({ amount });
  await issueTokensQ.run();

  const portfolioQ = await api.identities.createPortfolio({ name: `MY_PORTFOLIO_${Date.now().toString().slice(-6)}` });
  const portfolio = await portfolioQ.run();

  const renameQ = await portfolio.modifyName({ name: `NEW_NAME_${Date.now().toString().slice(-6)}` });
  await renameQ.run();

  const [defaultPortfolio, customPortfolio] = await identity.portfolios.getPortfolios(); // First element is always the default Portfolio

  const defaultPortfolioBalance = await defaultPortfolio.getAssetBalances({
    assets: [asset.id],
  }); // Can be called with no arguments to fetch all balances
  printBalance(defaultPortfolioBalance, 'Default');

  const customPortfolioBalance = await customPortfolio.getAssetBalances({
    assets: [asset.id],
  });
  printBalance(customPortfolioBalance, 'NEW_NAME');

  const transferQ = await defaultPortfolio.moveFunds({
    to: customPortfolio,
    items: [{ asset: asset.id, amount }],
  });
  await transferQ.run();

  const defaultPortfolioBalanceAfter = await defaultPortfolio.getAssetBalances({
    assets: [asset.id],
  });
  printBalance(defaultPortfolioBalanceAfter, 'Default', true);

  const customPortfolioBalanceAfter = await customPortfolio.getAssetBalances({
    assets: [asset.id],
  });
  printBalance(customPortfolioBalanceAfter, 'NEW_NAME', true);

  const [{ total: tokensInCustomPortfolio }] = customPortfolioBalanceAfter;

  console.log(`Redeeming ${tokensInCustomPortfolio} ${asset.id} from renamed Portfolio `);
  // redeem funds from portfolio that we added them to
  const redeemQ = await asset.redeem({ amount: tokensInCustomPortfolio, from: customPortfolio.id });
  await redeemQ.run();

  const deleteQ = await identity.portfolios.delete({ portfolio: customPortfolio }); // Will throw an error if the Portfolio has any assets
  await deleteQ.run();

  await api.disconnect();
})();
