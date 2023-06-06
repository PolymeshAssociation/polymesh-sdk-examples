import { BigNumber, Polymesh } from '@polymeshassociation/polymesh-sdk';
import { Asset, KnownAssetType } from '@polymeshassociation/polymesh-sdk/types';
import { isPolymeshTransactionBatch } from '@polymeshassociation/polymesh-sdk/utils';

/*
 * This script showcases bundling transactions into a batch,
 * and splitting an existing batch into separate transactions
 */
export const batchTransactions = async (sdk: Polymesh, ticker: string): Promise<void> => {
  // Batching 3 different transactions
  const reserveTickerTx = await sdk.assets.reserveTicker({ ticker });
  const createPortfolioTx = await sdk.identities.createPortfolio({ name: `${ticker}-PORTFOLIO` });
  const freezeTx = await sdk.accountManagement.freezeSecondaryAccounts();

  const batchTx1 = await sdk.createTransactionBatch({
    // `as const` is necessary for the `.run()` to return a tuple of distinctly typed elements
    transactions: [reserveTickerTx, createPortfolioTx, freezeTx] as const,
  });

  // the third value is ignored because `freezeSecondaryAccounts` doesn't return anything
  const [reservation, portfolio] = await batchTx1.run();
  /*
   * Splitting a batch. This is useful for example if your Account is being subsidized.
   * Since batches cannot be subsidized, the only way to run the transactions would be to split
   * the batch.
   *
   * Usually transaction should be ran as a batch, since that will require less waiting
   */
  const batchTx2 = await sdk.assets.createAsset({
    name: 'Batch Split Example',
    ticker,
    isDivisible: true,
    initialSupply: new BigNumber(10000),
    assetType: KnownAssetType.EquityCommon,
  });

  // The transaction type needs to be narrowed with an exported type guard
  if (isPolymeshTransactionBatch<Asset>(batchTx2)) {
    const transactions = batchTx2.splitTransactions();

    // Transactions MUST be run in strict order, waiting for one to finalize before running the next.
    for (const tx of transactions) {
      await tx.run();
    }
  } else {
  }
};
