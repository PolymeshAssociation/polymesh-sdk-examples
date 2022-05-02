import { getClient } from '~/common/client';

/* 
  This script showcases Portfolio related functionality. It:    
    - Creates a Portfolio
    - Renames a Portfolio
    - Fetches an Identity's Portfolios
    - Fetches a Portfolio's Balances
    - Deletes a Portfolio
*/
(async (): Promise<void> => {
  console.log('Connecting to the node...\n\n');
  const api = await getClient(process.env.ACCOUNT_SEED);

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const identity = (await api.getSigningIdentity())!;
  console.log(`Connected! Signing Identity ID: ${identity.did}`);

  const portfolioQ = await api.identities.createPortfolio({ name: 'MY_PORTFOLIO' });
  const portfolio = await portfolioQ.run();

  const renameQ = await portfolio.modifyName({ name: 'NEW_NAME' });
  await renameQ.run();

  const [defaultPortfolio, ...numberedPortfolios] = await identity.portfolios.getPortfolios(); // First element is always the default Portfolio

  const balances = await defaultPortfolio.getAssetBalances({
    assets: ['TOKEN_1', 'TOKEN_2', 'TOKEN_3'],
  }); // Can be called with no arguments to fetch all balances
  balances.forEach(({ asset, total, locked }) => {
    console.log(
      `Balance of Asset asset ${
        asset.ticker
      }:\n- Total: ${total.toFormat()}\n- Locked: ${locked.toFormat()}`
    );
  });

  const deleteQ = await identity.portfolios.delete({ portfolio: numberedPortfolios[0] }); // Will throw an error if the Portfolio has any assets
  await deleteQ.run();

  await api.disconnect();
})();
