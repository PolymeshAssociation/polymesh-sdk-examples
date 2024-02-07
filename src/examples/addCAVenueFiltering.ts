import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { ConfidentialAsset } from '@polymeshassociation/polymesh-sdk/types';

import { getClient } from '~/common/client';
import { toHumanObject } from '~/common/utils';

/**
 * Retrieves all relevant info about a venue filtering for an asset
 */
export async function getVenueFiltering(asset: ConfidentialAsset) {
  console.log('\n----------------------------------------------------------------------\n');
  console.log('\n💡 Fetching venue filtering details  : ');

  const venueFilteringDetails = await asset.getVenueFilteringDetails();

  console.log(
    `\nℹ️ Venue Filtering details - ${JSON.stringify(toHumanObject(venueFilteringDetails))}`
  );
}

/* 
  This script showcases how to get a confidential asset instance with its ID and get all the relevant info about it
*/
(async (): Promise<void> => {
  console.log('Connecting to the node...\n');
  const account = process.argv[2];
  const assetId = process.argv[3];
  const allowedVenue = process.argv[4];
  if (!account || !process.env[account]) {
    throw new Error('Please specify the account to be used to create the venue');
  }
  if (!assetId || !allowedVenue) {
    throw new Error('Please specify asset ID and allowed Venue');
  }
  const api = await getClient(process.env[account]);

  const signingIdentity = await api.getSigningIdentity();
  if (!signingIdentity) {
    throw new Error(`Account information not found for ${account}`);
  }
  console.log(
    `\n💡 Enabling venue filtering for asset ID - ${assetId} and allowing venue - ${allowedVenue}`
  );

  const asset = await api.confidentialAssets.getConfidentialAsset({ id: assetId });

  const setFilteringTx = await asset.setVenueFiltering({
    enabled: true,
    allowedVenues: [new BigNumber(allowedVenue)],
  });

  await setFilteringTx.run();

  console.log(`\n✅ Venue filtering has been set for asset ID - ${asset.toHuman()}`);

  await getVenueFiltering(asset);

  await api.disconnect();
})();
