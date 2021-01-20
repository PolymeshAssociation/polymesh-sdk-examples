import { VenueType } from '@polymathnetwork/polymesh-sdk/types';
import BigNumber from 'bignumber.js';

import { getClient } from '~/common/client';

/* 
  This script demonstrates Settlement functionality. It:
    - Creates a Venue
    - Fetches all of the current Identity's Venues
    - Adds an Instruction to a Venue
    - Fetches all of the current Identity's Pending Instructions
    - Authorizes/Unauthorizes/Rejects an Instruction
*/
(async (): Promise<void> => {
  console.log('Connecting to the node...\n\n');
  const api = await getClient(process.env.ACCOUNT_SEED);

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const identity = (await api.getCurrentIdentity())!;
  console.log(`Connected! Current identity ID: ${identity.did}`);

  const venueQ = await identity.createVenue({
    details: 'My Venue',
    type: VenueType.Distribution,
  });

  console.log('Creating venue...');
  const venue = await venueQ.run();
  const { type, owner, description } = await venue.details();
  console.log('Venue created!');
  console.log(`Details:\n- Owner: ${owner?.did}\n- Type: ${type}\n- Description. ${description}`);

  /* Venues can be fetched */
  // const venues = await identity.getVenues();

  const instructionQ = await venue.addInstruction({
    legs: [
      {
        from: identity,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        to: process.env.BOB_DID!,
        amount: new BigNumber(1000),
        token: 'MY_TOKEN',
      },
    ],
    endBlock: new BigNumber(10000000),
    validFrom: new Date('12/25/2020'),
  });

  console.log('Creating Instruction...\n');
  const instruction = await instructionQ.run();

  /* Pending Instructions can be fetched */
  // const pendingInstructions = await venue.getPendingInstructions();

  const details = await instruction.details();
  console.log(`Instruction Created! Creation Date: ${details.createdAt}`);

  const auths = await instruction.getAffirmations();

  auths.forEach(({ identity, status }) => {
    console.log(`- Authorizing DID: ${identity.did}\n- Status: ${status}`); // Authorized/Pending/Rejected/Unknown
  });

  const legs = await instruction.getLegs();

  legs.forEach(({ from, to, amount, token }) => {
    console.log(
      `- From: ${from.uuid}\n- To: ${to.uuid}\n- Amount: ${amount.toFormat()}\n- Token: ${
        token.ticker
      }`
    );
  });

  const authorizeQ = await instruction.affirm();

  await authorizeQ.run();

  /* Instructions can be unauthorized or rejected */
  /* 
    const unauthorizeQ = await instruction.unauthorize();
    await unauthorzeQ.run();
    
    const rejectQ = await instruction.reject();
    await rejectQ.run();
  */
})();
