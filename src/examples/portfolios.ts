import { getClient } from '~/common/client';

/* 
  This script showcases Portfolio related functonality. It:    
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
  const identity = (await api.getCurrentIdentity())!;
  console.log(`Connected! Current identity ID: ${identity.did}`);

  const portfolioQ = await identity.portfolios.create({ name: 'MY_PORTFOLIO' });
  const portfolio = await portfolioQ.run();

  const renameQ = await portfolio.modifyName({ name: 'NEW_NAME' });
  await renameQ.run();

  const [defaultPortfolio, ...numberedPortfolios] = await identity.portfolios.getPortfolios(); // First element is always the default Portfolio

  const balances = await defaultPortfolio.getTokenBalances({
    tokens: ['TOKEN_1', 'TOKEN_2', 'TOKEN_3'],
  }); // Can be called with no arguments to fetch all balances
  balances.forEach(({ token, total, locked }) => {
    console.log(
      `Balance of token ${
        token.ticker
      }:\n- Total: ${total.toFormat()}\n- Locked: ${locked.toFormat()}`
    );
  });

  const deleteQ = await numberedPortfolios[0].delete(); // Will throw an error if the Portfolio has any assets
  await deleteQ.run();

  await api.disconnect();
})();
