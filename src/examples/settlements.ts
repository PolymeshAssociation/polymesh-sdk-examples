import { VenueType } from '@polymathnetwork/polymesh-sdk/types';
import BigNumber from 'bignumber.js';

import { getClient } from '~/common/client';

/* 
  This script showcases Settlement related functionality. It:
    - Creates a Venue
    - Fetches a Venue's details
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

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const bob = api.getIdentity({ did: process.env.BOB_DID! });

  const destinationPortfolio = await bob.portfolios.getPortfolio({ portfolioId: new BigNumber(3) });

  const instructionQ = await venue.addInstruction({
    legs: [
      {
        from: identity, // passing the Identity (or did) means the default portolio will be used
        to: destinationPortfolio, // or you can pass a Portfolio
        amount: new BigNumber(1000),
        token: 'MY_TOKEN',
      },
    ],
    endBlock: new BigNumber(49000),
    validFrom: new Date('12/25/2020'),
  });

  console.log('Creating Instruction...\n');
  const instruction = await instructionQ.run();

  /* Pending Instructions can be fetched */
  // const pendingInstructions = await venue.getPendingInstructions();

  const details = await instruction.details();
  console.log(`Instruction Created! Creation Date: ${details.createdAt}`);

  const auths = await instruction.getAuthorizations();

  auths.forEach(({ identity, authorizationStatus }) => {
    console.log(`- Authorizing DID: ${identity.did}\n- Status: ${authorizationStatus}`); // Authorized/Pending/Rejected/Unknown
  });

  const legs = await instruction.getLegs();

  legs.forEach(({ from, to, amount, token }) => {
    console.log(
      `- From: ${from.owner.did}\n- To: ${to.owner.did}\n- Amount: ${amount.toFormat()}\n- Token: ${
        token.ticker
      }`
    );
  });

  const authorizeQ = await instruction.authorize(); // will be `affirm` when the 2.3 upgrade is complete

  await authorizeQ.run();

  /* Instructions can be unauthorized (will be withdrawn) or rejected */
  /* 
    const unauthorizeQ = await instruction.unauthorize();
    await unauthorzeQ.run();
    
    const rejectQ = await instruction.reject();
    await rejectQ.run();
  */
})();
