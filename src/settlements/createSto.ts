import { BigNumber, Polymesh } from '@polymeshassociation/polymesh-sdk';
import {
  OfferingBalanceStatus,
  OfferingSaleStatus,
  OfferingTimingStatus,
  VenueType,
} from '@polymeshassociation/polymesh-sdk/types';

import { addIsNotBlocked } from '~/sdk/settlements/util';

/*
  This script showcases Security Token Offering (STO) functionality. It:
  - Create a Venue and Portfolio dedicated to the offering
  - Launches an Offering
  - Modifies the start and end time
  - Fetches its details
  - Invests in it
  - Freezes/unfreezes it
  - Closes it
  - Fetches all investments made
*/
export const createSto = async (
  sdk: Polymesh,
  investorDid: string,
  offeringTicker: string,
  raisingTicker: string
): Promise<void> => {
  const [identity, investor, offeringAsset, raisingAsset] = await Promise.all([
    sdk.getSigningIdentity(),
    sdk.identities.getIdentity({ did: investorDid }),
    sdk.assets.getAsset({ ticker: offeringTicker }),
    sdk.assets.getAsset({ ticker: raisingTicker }),
  ]);
  if (!identity) {
    throw new Error('the SDK must have a signing identity');
  }

  // Get the investors portfolio and primary account
  const [investorPortfolio, { account: investorAccount }] = await Promise.all([
    investor.portfolios.getPortfolio(),
    investor.getPrimaryAccount(),
  ]);

  // Assets need non default compliance requirements to be moved
  await Promise.all([
    addIsNotBlocked(offeringAsset),
    addIsNotBlocked(raisingAsset, investorAccount.address),
  ]);

  // Create a Venue to use for the offering. An existing Venue could also be used
  const createVenueTx = await sdk.settlements.createVenue({
    description: 'Example Offering Venue',
    type: VenueType.Sto,
  });
  // Create a Portfolio to store raised funds in
  const createPortfolioTx = await sdk.identities.createPortfolio({ name: 'Example STO' });
  // batch the transactions for efficiency
  const batchTx = await sdk.createTransactionBatch({
    transactions: [createVenueTx, createPortfolioTx] as const,
  });
  const [venue, raisingPortfolio] = await batchTx.run();
  // Provide equity from the identities default Portfolio
  const offeringPortfolio = await identity.portfolios.getPortfolio();

  const launchTx = await offeringAsset.offerings.launch({
    offeringPortfolio, // optional, defaults to the PIA's default portfolio
    raisingPortfolio,
    raisingCurrency: raisingAsset.ticker,
    venue, // optional, defaults to the first "Offering" type venue created by the owner of the Offering Portfolio
    name: 'Example STO',
    start: undefined, // optional, defaults to now
    end: new Date(new Date().getTime() + 365 * 24 * 60 * 60 * 1000), // optional, defaults to never
    // tiers can incentivize early investors with a better rate
    tiers: [
      {
        price: new BigNumber(10),
        amount: new BigNumber(100),
      },
      {
        price: new BigNumber(12),
        amount: new BigNumber(100),
      },
    ],
    minInvestment: new BigNumber(10),
  });

  // Existing STOs can also later be fetched with `asset.offerings.get()`
  const offering = await launchTx.run();

  // Modify start/end times
  const modifySaleTimeTx = await offering.modifyTimes({
    end: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000),
  });
  await modifySaleTimeTx.run();
  // Fetch offering details
  const offeringDetails = await offering.details();
  // Fetch an investable offering for the asset
  const [{ offering: investableOffering }] = await offeringAsset.offerings.get({
    status: {
      timing: OfferingTimingStatus.Started,
      sale: OfferingSaleStatus.Live,
      balance: OfferingBalanceStatus.Available,
    },
  });

  // Assumes the investor has sufficient balance and is loaded into the SDK Signing Manager
  const investTx = await investableOffering.invest(
    {
      purchasePortfolio: investorPortfolio,
      fundingPortfolio: investorPortfolio,
      purchaseAmount: new BigNumber(10),
      maxPrice: new BigNumber(11),
    },
    { signingAccount: investorAccount }
  );
  await investTx.run();
  // Freeze the offering
  const freezeTx = await offering.freeze();
  await freezeTx.run();
  // Unfreeze
  const unfreezeTx = await offering.unfreeze();
  await unfreezeTx.run();
  // Close
  const closeTx = await offering.close();
  await closeTx.run();
  // Fetch investments from the offering
  const { data: investments } = await offering.getInvestments();
};
