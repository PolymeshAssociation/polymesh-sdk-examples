import { MetadataEntry } from '@polymeshassociation/polymesh-sdk/internal';
import {
  Identity,
  MetadataLockStatus,
  MetadataType,
} from '@polymeshassociation/polymesh-sdk/types';

import { getClient } from '~/common/client';

/* 
  This script showcases Metadata related functionality. It:
    - Fetches all the Global Metadata Keys
    - Creates a new Asset Metadata
    - Fetches Checkpoint details
    - Creates a Schedule
    - Fetches asset's Schedules
    - Fetches Schedule details
    - Fetches Checkpoints originated by a Schedule
    - Deletes a Schedule
*/
(async (): Promise<void> => {
  console.log('Connecting to the node...\n');
  const api = await getClient(process.env.ACCOUNT_SEED);

  const ticker = process.argv[2];

  console.log(ticker);

  if (!ticker) {
    throw new Error('Please supply a ticker as an argument to the script');
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const identity: Identity = (await api.getSigningIdentity())!;
  console.log(`Connected! Signing Identity ID: ${identity.did}`);

  console.log(`\n➡️ Getting Global Asset Metadata Keys`);

  const asset = await api.assets.getAsset({ ticker });

  /**
   * Fetches and displays metadata value
   */
  const getMetadataValue = async (metadata: MetadataEntry): Promise<void> => {
    const metadataValue = await metadata.value();

    console.log('Value - ');
    console.log(JSON.stringify(metadataValue));
  };

  /**
   * Sets metadata value and details about the metadata value
   */
  const setMetadataValueAndDetails = async (metadata: MetadataEntry): Promise<void> => {
    const { id, type } = metadata;
    console.log(`\n➡️ Set value for ${type} Asset Metadata - "${id.toString()}"`);

    const value = 'SOME_VALUE';
    const setGlobalMetadataTx = await metadata.set({
      value,
    });

    console.log(`Setting value - '${value}' for ${type} Metadata id '${id.toString()}'...`);
    await setGlobalMetadataTx.run();

    console.log(`\n✔️ ${type} Metadata value set`);

    console.log(`\n➡️ Setting details (expiry and lockStatus) for the Metadata value`);

    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 1);

    const lockedUntil = new Date(new Date().getTime() + 30 * 24 * 60 * 60);

    const setDetailsTx = await metadata.set({
      details: {
        expiry,
        lockStatus: MetadataLockStatus.LockedUntil,
        lockedUntil,
      },
    });

    await setDetailsTx.run();

    console.log(`\n✔️ Metadata value details set`);

    console.log(`\n➡️ Fetching the newly set value for ${type} Metadata`);

    await getMetadataValue(metadata);
  };

  const globalMetadataKeys = await api.assets.getGlobalMetadataKeys();

  if (globalMetadataKeys.length > 0) {
    console.log('\nGlobal Metadata Keys - ');

    globalMetadataKeys.forEach(({ id, name, specs }) => {
      console.log(`- ID : ${id.toString()}`);
      console.log(`  Name : ${name}`);
      console.log(`  Specs : ${JSON.stringify(specs)}`);
    });

    console.log('\n* Get Metadata Entry for a specific id and type - ');
    const { id } = globalMetadataKeys[0];

    console.log('Fetching...');
    const globalMetadata = await asset.metadata.getOne({ type: MetadataType.Global, id });

    console.log(JSON.stringify(globalMetadata.toHuman()));

    console.log(`\n✔️ Fetched Metadata Entry`);

    await setMetadataValueAndDetails(globalMetadata);
  } else {
    console.log('No Global Metadata Keys exists');
  }

  console.log(`\n➡️ Register a new Local Metadata`);

  const registerTx = await asset.metadata.register({
    name: 'LOCAL-METADATA',
    specs: { description: 'This is a local asset metadata', url: 'https://www.example.com' },
  });

  console.log('Registering...');

  const localMetadata = await registerTx.run();

  console.log(`\n✔️ New local Metadata registered with id '${localMetadata.id.toString()}'`);

  await setMetadataValueAndDetails(localMetadata);

  console.log(`\n➡️ Register and set a new Local Metadata in one go`);

  const registerAndSetTx = await asset.metadata.register({
    name: 'LOCAL-METADATA-2',
    specs: { description: 'This is a local asset metadata 2', url: 'https://www.example.com/2' },
    value: 'Metadata Value',
    details: {
      expiry: null,
      lockStatus: MetadataLockStatus.Locked,
    },
  });

  console.log('Registering...');

  const localMetadata2 = await registerAndSetTx.run();

  console.log(`\n✔️ New local Metadata registered - '${JSON.stringify(localMetadata2.toHuman())}'`);

  console.log(`\n➡️ Details - `);

  const localMetadata2Details = await localMetadata2.details();

  console.log(JSON.stringify(localMetadata2Details));

  await getMetadataValue(localMetadata2);

  console.log('\n* Fetch all Metadata entries for the Asset - ');

  console.log('Fetching...');
  const allMetadata = await asset.metadata.get();

  allMetadata.forEach(metadata => console.log(metadata.toHuman()));

  console.log(`\n✔️ All Metadata Entry fetched`);

  await api.disconnect();
})();
