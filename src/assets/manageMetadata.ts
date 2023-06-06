import { Polymesh } from '@polymeshassociation/polymesh-sdk';
import { MetadataLockStatus, MetadataType } from '@polymeshassociation/polymesh-sdk/types';

/*
  This script showcases Metadata related functionality. It:
    - Get all the Global Metadata Keys
    - Get Metadata Entry for a specific id and type
    - Global Asset Metadata
      - Set value for Global Asset Metadata
      - Setting details (expiry and lockStatus) for the Metadata value
      - Fetching the newly set value for Global Metadata
    - Local Asset Metadata
      - Register a new local Asset Metadata
      - Set value for the newly created Metadata
      - Set details for the Metadata value
      - Register and set value for a local Asset Metadata
    - Fetch all Metadata for a Ticker
*/
export const manageMetadata = async (sdk: Polymesh, ticker: string): Promise<void> => {
  const identity = await sdk.getSigningIdentity();
  if (!identity) {
    throw new Error('the SDK must have an identity');
  }

  const asset = await sdk.assets.getAsset({ ticker });

  // register a new metadata key for the asset
  const registerTx = await asset.metadata.register({
    name: 'LOCAL-METADATA',
    specs: { description: 'This is a local asset metadata', url: 'https://www.example.com' },
  });
  const metadata = await registerTx.run();
  // Now set values for the metadata
  const value = 'Example Metadata';
  const expiry = new Date();
  expiry.setFullYear(expiry.getFullYear() + 1);
  const lockedUntil = new Date(new Date().getTime() + 30 * 24 * 60 * 60);

  const setDetailsTx = await metadata.set({
    value,
    details: {
      expiry,
      lockStatus: MetadataLockStatus.LockedUntil,
      lockedUntil,
    },
  });
  await setDetailsTx.run();
  // Fetch global metadata keys
  const globalKeys = await sdk.assets.getGlobalMetadataKeys();

  if (globalKeys.length) {
    // Global metadata functions like local metadata, except the keys are set by the governance council
    const globalMetadata = await asset.metadata.getOne({
      type: MetadataType.Global,
      id: globalKeys[0].id,
    });

    const globalSetTx = await globalMetadata.set({ value });
    globalSetTx.run();
  }
};
