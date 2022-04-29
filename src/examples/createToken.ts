import { BigNumber } from '@polymathnetwork/polymesh-sdk';
import { KnownAssetType } from '@polymathnetwork/polymesh-sdk/types';

import { getClient } from '~/common/client';

/* 
  This script showcases Asset related functionality. It: 
    - Reserves a Asset with the specified ticker
    - Creates it
    - Assigns a list of documents to the Asset
    - Removes a document from the current list
*/
(async (): Promise<void> => {
  console.log('Connecting to the node...\n\n');
  const api = await getClient(process.env.ACCOUNT_SEED);

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const identity = (await api.getSigningIdentity())!;
  console.log(`Connected! Signing Identity ID: ${identity.did}`);

  const ticker = process.argv[2];

  if (!ticker) {
    throw new Error('Please supply a ticker as an argument to the script');
  }

  const reservationQ = await api.assets.reserveTicker({
    ticker,
  });

  console.log('Reserving ticker...');
  const reservation = await reservationQ.run();
  const { expiryDate, owner } = await reservation.details();
  console.log('Ticker reserved!');
  console.log(`Details:\n- Owner: ${owner?.did}\n- Expiry Date: ${expiryDate}\n`);

  const creationQ = await reservation.createAsset({
    name: 'Test',
    isDivisible: true,
    assetType: KnownAssetType.EquityCommon,
    initialSupply: new BigNumber(3000),
    requireInvestorUniqueness: false,
  });

  console.log('Creating Asset...\n');
  const asset = await creationQ.run();

  console.log(`Assigning a list of documents to ${ticker}...\n`);

  const doc1 = {
    name: 'Document One',
    uri: 'https://some.web/one',
    contentHash: '0x01',
  };
  const doc2 = {
    name: 'Document Two',
    uri: 'https://some.web/two',
    contentHash: '0x02',
  };

  let setDocumentsQ = await asset.documents.set({ documents: [doc1, doc2] });
  await setDocumentsQ.run();

  let docs = await asset.documents.get();
  console.log('Added documents:');
  docs.data.forEach(({ name }) => {
    console.log(`- ${name}`);
  });

  console.log('\nRemoving Document One...\n');

  setDocumentsQ = await asset.documents.set({ documents: [doc2] });
  await setDocumentsQ.run();

  docs = await asset.documents.get();

  console.log('Final Documents:');
  docs.data.forEach(({ name }) => {
    console.log(`- ${name}`);
  });

  await api.disconnect();
})();
