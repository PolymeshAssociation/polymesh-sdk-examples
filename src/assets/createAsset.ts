import { Polymesh } from '@polymeshassociation/polymesh-sdk';
import {
  Asset,
  CreateAssetWithTickerParams,
  KnownAssetType,
  ProcedureOpts,
} from '@polymeshassociation/polymesh-sdk/types';
/**
 * This function showcases creating an Asset in single transaction
 */
export const createAsset = async (
  sdk: Polymesh,
  args: Partial<CreateAssetWithTickerParams>,
  opts?: ProcedureOpts
): Promise<Asset> => {
  // Note, optional params include `initialSupply`, `initialStatistics` and `documents` among others
  const requiredParams = {
    name: 'Asset Name',
    ticker: 'TICKER',
    isDivisible: false,
    assetType: KnownAssetType.EquityCommon,
    requireInvestorUniqueness: false,
  } as const;

  const params = {
    ...requiredParams,
    ...args,
  };

  // Validates arguments (e.g. ticker is not taken) and returns a Transaction to be ran.
  const createAssetTx = await sdk.assets.createAsset(params, opts);

  // The `Asset` entity will be returned after the transaction is finalized
  const asset = await createAssetTx.run();
  return asset;
};
