import { Polymesh } from '@polymeshassociation/polymesh-sdk';
import {
  IdentityBalance,
  PaginationOptions,
  ResultSet,
} from '@polymeshassociation/polymesh-sdk/types';

/**
 * This function demonstrates getting an Asset's holders from its ticker
 */
export const getAssetHolders = async (
  sdk: Polymesh,
  ticker: string,
  paginationOpts?: PaginationOptions
): Promise<ResultSet<IdentityBalance>> => {
  const asset = await sdk.assets.getAsset({ ticker });

  return asset.assetHolders.get(paginationOpts);
};
