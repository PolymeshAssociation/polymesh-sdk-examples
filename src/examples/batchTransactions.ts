import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { FungibleAsset } from '@polymeshassociation/polymesh-sdk/internal';
import { KnownAssetType } from '@polymeshassociation/polymesh-sdk/types';
import { isPolymeshTransactionBatch } from '@polymeshassociation/polymesh-sdk/utils';
import P from 'bluebird';

import { getClient } from '~/common/client';

/*
 * This script showcases bundling transactions into a batch,
 * and splitting an existing batch into separate transactions
 */
(async (): Promise<void> => {
  console.log('Connecting to the node...\n\n');
  const api = await getClient(process.env.ACCOUNT_SEED);

  const suffix = Date.now().toString().slice(-6);

  // Batching 3 different transactions
  const reserveTickerTx = await api.assets.reserveTicker({ ticker: `BATCH${suffix}` });
  const createPortfolioTx = await api.identities.createPortfolio({
    name: `MY_PORTFOLIO_${suffix}`,
  });
  const createPortfolioTx2 = await api.identities.createPortfolio({
    name: `MY_PORTFOLIO_${suffix}_2`,
  });

  const batchTx1 = await api.createTransactionBatch({
    // `as const` is necessary so that the array is identified as a tuple
    transactions: [reserveTickerTx, createPortfolioTx, createPortfolioTx2] as const,
  });

  const [reservation, portfolio, portfolio2] = await batchTx1.run();

  console.log(`Ticker ${reservation.ticker} reserved`);
  console.log(`Portfolio with ID ${portfolio.id.toFormat()} created`);
  console.log(`Portfolio with ID ${portfolio2.id.toFormat()} created`);

  // Batching the same transaction
  const portfolioTxs = await P.map([1, 2, 3, 4, 5], (n) => {
    const name = `PORTFOLIO_${suffix}_${n}`;

    return api.identities.createPortfolio({
      name,
    });
  });

  const batchTx2 = await api.createTransactionBatch({
    transactions: portfolioTxs,
  });

  const newPortfolios = await batchTx2.run();

  newPortfolios.forEach(({ id }) => {
    console.log(`Portfolio with ID ${id.toFormat()} created`);
  });

  /*
   * Splitting a batch. This is useful for example if your Account is being subsidized.
   * Since batches cannot be subsidized, the only way to run the transactions would be to split
   * the batch.
   */
  const batchTx3 = await api.assets.createAsset({
    name: `MY_ASSET_${suffix}`,
    ticker: `MYTKR${suffix}`,
    isDivisible: true,
    initialSupply: new BigNumber(10000),
    assetType: KnownAssetType.EquityCommon,
  });

  if (isPolymeshTransactionBatch<FungibleAsset>(batchTx3)) {
    const transactions = batchTx3.splitTransactions();

    // Transactions MUST be run in strict order, waiting for one to finalize before running the next.
    await P.mapSeries(transactions, async (tx) => {
      const result = await tx.run();

      // The original result of the batch is returned only by the last transaction in the split array
      if (result) {
        console.log(`Asset with ID ${result.id} created`);
      }
    });
  } else {
    const result = await batchTx3.run();

    console.log(`Asset with ID ${result.id} created`);
  }

  await api.disconnect();
})();
