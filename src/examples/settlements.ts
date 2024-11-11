import { BigNumber } from '@polymeshassociation/polymesh-sdk';
import { VenueType } from '@polymeshassociation/polymesh-sdk/types';

import { getClient } from '~/common/client';
import { isFungibleLeg, isNftLeg } from '~/common/utils';

/*
  This script showcases Settlement related functionality. It:
    - Creates a Venue
    - Fetches a Venue's details
    - Fetches all of the signing Identity's Venues
    - Adds an Instruction to a Venue
    - Fetches all of the signing Identity's Pending Instructions
    - Authorize/Unauthorize/Reject an Instruction
*/
(async (): Promise<void> => {
  console.log('Connecting to the node...\n\n');
  const api = await getClient(process.env.ACCOUNT_SEED);

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const identity = (await api.getSigningIdentity())!;
  console.log(`Connected! Signing Identity ID: ${identity.did}`);

  const venueQ = await api.settlements.createVenue({
    description: 'My Venue',
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
  const bob = await api.identities.getIdentity({ did: process.env.BOB_DID! });

  const destinationPortfolio = await bob.portfolios.getPortfolio();

  const instructionQ = await venue.addInstruction({
    legs: [
      {
        to: identity, // passing the Identity (or did) means the default portfolio will be used
        from: destinationPortfolio, // or you can pass a Portfolio
        amount: new BigNumber(1000),
        asset: '0x9226abfd9c2d8b8583ab0b350cf44d0f',
      },
    ],
    endBlock: new BigNumber(10000000),
    tradeDate: new Date('12/25/2030'),
    memo: 'Some message', // optional - passing a message with the instruction
  });

  console.log('Creating Instruction...\n');
  const instruction = await instructionQ.run();

  /* Pending Instructions can be fetched */
  // const pendingInstructions = await venue.getPendingInstructions();

  const details = await instruction.details();
  console.log(`Instruction Created! Creation Date: ${details.createdAt}`);

  const { data: affirmations } = await instruction.getAffirmations();

  affirmations.forEach(({ identity, status }) => {
    console.log(`- Authorizing DID: ${identity.did}\n- Status: ${status}`); // Authorized/Pending/Rejected/Unknown
  });

  const { data: legs } = await instruction.getLegs();

  for (const leg of legs) {
    if (isFungibleLeg(leg)) {
      const { from, to, amount, asset } = leg;
      console.log(
        `- Fungible Leg:\n- From: ${from.owner.did}\n- To: ${
          to.owner.did
        }\n- Amount: ${amount.toString()}\n- Asset: ${asset}`
      );
    }

    if (isNftLeg(leg)) {
      const { from, to, nfts, asset } = leg;
      console.log(
        `- Nft Leg:\n- From: ${from.owner.did}\n- To: ${to.owner.did} \n- Asset: ${asset}`
      );

      const metaDataPromises = nfts.map((nft) => nft.getMetadata());
      const imagePromises = nfts.map((nft) => nft.getImageUri());

      const metadata = await Promise.all(metaDataPromises);
      const images = await Promise.all(imagePromises);

      for (let i = 0; i < nfts.length; i++) {
        console.log(`- NFT ${nfts[i].id}: ${metadata[i]}\n- Image: ${images[i]}`);
        if (metadata[i].length > 0) {
          console.log('- Metadata:');
          metadata[i].forEach((m) => console.log(`${m.key}: ${m.value}`));
        }
      }
    }
  }

  const authorizeQ = await instruction.affirm();

  await authorizeQ.run();

  /* Instructions can be unauthorized (will be withdrawn) or rejected */
  /*
    const unauthorizeQ = await instruction.unauthorize();
    await unauthorizeQ.run();

    const rejectQ = await instruction.reject();
    await rejectQ.run();
  */

  await api.disconnect();
})();
