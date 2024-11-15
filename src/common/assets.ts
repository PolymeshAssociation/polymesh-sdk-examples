import { Polymesh } from '@polymeshassociation/polymesh-sdk';
import { Asset, FungibleAsset } from '@polymeshassociation/polymesh-sdk/types';

import { isAssetId } from '~/common/utils';

/**
 * @hidden
 */
export async function getAsset(api: Polymesh, assetInput: string): Promise<Asset> {
  let asset;

  if (isAssetId(assetInput)) {
    asset = await api.assets.getAsset({ assetId: assetInput });
  } else {
    asset = await api.assets.getAsset({ ticker: assetInput });
  }

  return asset;
}

/**
 * @hidden
 */
export async function getFungibleAsset(api: Polymesh, assetInput: string): Promise<FungibleAsset> {
  let asset;

  if (isAssetId(assetInput)) {
    asset = await api.assets.getFungibleAsset({ assetId: assetInput });
  } else {
    asset = await api.assets.getFungibleAsset({ ticker: assetInput });
  }

  return asset;
}
