import { BigNumber, Polymesh } from '@polymeshassociation/polymesh-sdk';

import { randomNonce } from '~/util';

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
export const managePortfolios = async (sdk: Polymesh, ticker: string): Promise<void> => {
  const signingIdentity = await sdk.getSigningIdentity();
  if (!signingIdentity) {
    throw new Error('the SDK must have a signing identity');
  }

  const asset = await sdk.assets.getAsset({ ticker });

  const nonce = randomNonce(12);
  const portfolioTx = await sdk.identities.createPortfolio({ name: `TEST-${nonce}` });
  const portfolio = await portfolioTx.run();

  const renameTx = await portfolio.modifyName({ name: `RENAME-${nonce}` });
  await renameTx.run();
  // Get the portfolios of the Identity. First element is always the default Portfolio
  const [defaultPortfolio, examplePortfolio] = await signingIdentity.portfolios.getPortfolios();

  const amount = new BigNumber(3);
  const [{ free: freeBalance }] = await defaultPortfolio.getAssetBalances({ assets: [ticker] });
  const transferTx = await defaultPortfolio.moveFunds({
    to: examplePortfolio,
    items: [{ asset: ticker, amount }],
  });
  await transferTx.run();
  const customPortfolioBalanceAfter = await examplePortfolio.getAssetBalances({
    assets: [ticker, 'TOKEN_2', 'TOKEN_3'],
  });

  const [{ total: tokensInCustomPortfolio }] = customPortfolioBalanceAfter;

  // Redeem from the receiving portfolio, aka "burn", removes tokens from the chain.
  const redeemTx = await asset.redeem({
    amount: tokensInCustomPortfolio,
    from: examplePortfolio.id,
  });
  await redeemTx.run();
  // Will throw an error if the Portfolio has any assets
  const deleteTx = await signingIdentity.portfolios.delete({ portfolio: examplePortfolio });
  await deleteTx.run();
};
