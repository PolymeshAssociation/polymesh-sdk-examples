import { KnownTokenType } from '@polymathnetwork/polymesh-sdk/types';
import BigNumber from 'bignumber.js';

import { getClient } from '~/common/client';

/* 
  This script showcases Security Token related functonality. It: 
    - Reserves a Security Token with the specified ticker
    - Creates it
    - Assigns a list of documents to the Security Token
    - Removes a document from the current list
*/
(async (): Promise<void> => {
  console.log('Connecting to the node...\n\n');
  const api = await getClient(process.env.ACCOUNT_SEED);

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const identity = (await api.getCurrentIdentity())!;
  console.log(`Connected! Current identity ID: ${identity.did}`);

  const ticker = process.argv[2];

  if (!ticker) {
    throw new Error('Please supply a ticker as an argument to the script');
  }

  const reservationQ = await api.reserveTicker({
    ticker,
  });

  console.log('Reserving ticker...');
  const reservation = await reservationQ.run();
  const { expiryDate, owner } = await reservation.details();
  console.log('Ticker reserved!');
  console.log(`Details:\n- Owner: ${owner?.did}\n- Expiry Date: ${expiryDate}\n`);

  const creationQ = await reservation.createToken({
    name: 'Test',
    isDivisible: true,
    tokenType: KnownTokenType.EquityCommon,
    totalSupply: new BigNumber(3000),
  });

  console.log('Creating Security Token...\n');
  const token = await creationQ.run();

  const { primaryIssuanceAgent } = await token.details();

  console.log(`Token created! Primary Issuance Agent: ${primaryIssuanceAgent?.did}\n`);

  console.log(`Assigning a list of documents to ${ticker}...\n`);

  const doc1 = {
    name: 'Document One',
    uri: 'https://some.web/one',
    contentHash: 'someHash',
  };
  const doc2 = {
    name: 'Document Two',
    uri: 'https://some.web/two',
    contentHash: 'someHash',
  };

  let setDocuments = await token.documents.set({ documents: [doc1, doc2] });
  await setDocuments.run();

  let docs = await token.documents.get();
  console.log('Added documents:');
  docs.data.forEach(({ name }) => {
    console.log(`- ${name}`);
  });

  console.log('\nRemoving Document One...\n');

  setDocuments = await token.documents.set({ documents: [doc2] });
  await setDocuments.run();

  docs = await token.documents.get();
  console.log('Final Documents:');
  docs.data.forEach(({ name }) => {
    console.log(`- ${name}`);
  });
})();
