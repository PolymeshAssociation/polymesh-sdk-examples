import { ConfidentialAsset } from '@polymeshassociation/polymesh-private-sdk/types';

import { getClient } from '~/common/privateClient';
import { toHumanObject } from '~/common/utils';

/**
 * Retrieves all relevant info about a confidential asset
 */
export async function getConfidentialAssetDetails(asset: ConfidentialAsset) {
  console.log('\n----------------------------------------------------------------------\n');
  console.log('\n💡 Getting all the information about asset ID : ', asset.toHuman());

  const [exists, details, auditorInfo, venueFilteringDetails] = await Promise.all([
    asset.exists(),
    asset.details(),
    asset.getAuditors(),
    asset.getVenueFilteringDetails(),
  ]);

  console.log('\nℹ️ Exists - ', exists);
  console.log('\nℹ️ Details - ', toHumanObject(details));
  console.log('\nℹ️ Auditors - ', toHumanObject(auditorInfo));
  console.log('\nℹ️ Venue filtering details - ', toHumanObject(venueFilteringDetails));
}
/* 
  This script showcases how to get a confidential asset instance with its ID and get all the relevant info about it
*/
(async (): Promise<void> => {
  console.log('Connecting to the node...\n');
  const assetId = process.argv[2];
  if (!assetId) {
    throw new Error('Please specify asset ID to fetch the details');
  }
  const api = await getClient();

  const asset = await api.confidentialAssets.getConfidentialAsset({ id: assetId });

  await getConfidentialAssetDetails(asset);

  await api.disconnect();
})();
