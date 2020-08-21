import { KnownTokenType } from '@polymathnetwork/polymesh-sdk/types';
import BigNumber from 'bignumber.js';

import { getClient } from '~/common/client';

/* 
  This script reserves and creates a Security Token
    with the specified ticker
*/
(async () => {
  console.log('Connecting to the node...\n\n');
  const api = await getClient(process.env.ACCOUNT_SEED);

  const identity = api.getIdentity();
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
    treasury: api.getIdentity(),
  });

  console.log('Creating Security Token...\n');
  const token = await creationQ.run();

  const { treasuryIdentity } = await token.details();

  console.log(`Token created! Treasury DID: ${treasuryIdentity?.did}`);
})();
