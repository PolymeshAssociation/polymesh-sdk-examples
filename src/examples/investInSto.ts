import { LocalSigningManager } from '@polymeshassociation/local-signing-manager';
import { BigNumber, Polymesh } from '@polymeshassociation/polymesh-sdk';
import { Identity } from '@polymeshassociation/polymesh-sdk/types';
import {
  OfferingBalanceStatus,
  OfferingSaleStatus,
} from '@polymeshassociation/polymesh-sdk/types';

import { getFungibleAsset } from '~/common/assets';

async function connectAs(mnemonic: string): Promise<Polymesh> {
  const signingManager = await LocalSigningManager.create({
    accounts: [{ mnemonic }],
  });

  return Polymesh.connect({
    /* eslint-disable @typescript-eslint/no-non-null-assertion */
    nodeUrl: process.env.POLYMESH_NODE_URL!,
    middlewareV2: {
      link: process.env.MIDDLEWARE_LINK!,
      key: process.env.MIDDLEWARE_KEY!,
    },
    /* eslint-enable @typescript-eslint/no-non-null-assertion */
    signingManager,
  });
}

async function connectDistinctInvestor(
  ownerDid: string,
  seeds: string[],
  aliceApi: Polymesh
): Promise<{ api: Polymesh; identity: Identity }> {
  for (const seed of seeds) {
    const api = await connectAs(seed);
    const identity = await api.getSigningIdentity();

    if (identity && identity.did !== ownerDid) {
      return { api, identity };
    }

    await api.disconnect();
  }

  const mnemonic = LocalSigningManager.generateAccount();
  const api = await connectAs(mnemonic);
  const [targetAccount] = await api.accountManagement.getSigningAccounts();
  const identity = await (
    await aliceApi.identities.registerIdentity({ targetAccount: targetAccount.address })
  ).run();

  console.log(`Registered new investor identity ${identity.did}`);
  return { api, identity };
}

/*
  This script showcases Offering investment functionality. It:
  - Fetches all Offerings for a Asset
  - Invests in one of them (the investor must be a different identity than the asset owner)
*/
(async (): Promise<void> => {
  const assetInput = process.argv[2];

  if (!assetInput) {
    throw new Error('Please supply a ticker or Asset ID as an argument to the script');
  }

  const investorSeeds = [process.env.INVESTOR_SEED, process.env.BOB_SEED].filter(
    (seed): seed is string => Boolean(seed)
  );

  console.log('Connecting to the node (Alice)...\n\n');
  const aliceApi = await connectAs(process.env.ACCOUNT_SEED ?? '//Alice');
  const asset = await getFungibleAsset(aliceApi, assetInput);
  const { owner } = await asset.details();

  const offerings = await asset.offerings.get({
    status: {
      sale: OfferingSaleStatus.Live,
      balance: OfferingBalanceStatus.Available,
    },
  });

  if (!offerings.length) {
    await aliceApi.disconnect();
    throw new Error(
      'No live offerings found for this asset. Run the stos example first to launch an offering.'
    );
  }

  const purchaseAmount = new BigNumber(10);
  const maxPrice = new BigNumber(110);
  const offeringId = offerings[0].offering.id;

  const { raisingCurrency, minInvestment } = await offerings[0].offering.details();
  const requiredFunds = BigNumber.max(
    purchaseAmount.multipliedBy(maxPrice),
    minInvestment
  );

  const { api: investorApi, identity: investor } = await connectDistinctInvestor(
    owner!.did,
    investorSeeds,
    aliceApi
  );

  // Fund the investor with the raising currency (Alice issues and settles tokens)
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const alice = (await aliceApi.getSigningIdentity())!;
  const currencyAsset = await getFungibleAsset(aliceApi, raisingCurrency);
  const investorDefault = await investor.portfolios.getPortfolio();
  const [investorBalance] = await investorDefault.getAssetBalances({
    assets: [raisingCurrency],
  });
  const investorHasFunds = investorBalance?.free.gte(requiredFunds) ?? false;

  if (!investorHasFunds) {
    const issueQ = await currencyAsset.issuance.issue({
      amount: requiredFunds.multipliedBy(2),
    });
    await issueQ.run();

    const [venue] = await alice.getVenues();
    const createdInstruction = await (
      await venue.addInstruction({
        legs: [
          {
            from: alice,
            to: investor,
            asset: raisingCurrency,
            amount: requiredFunds.multipliedBy(2),
          },
        ],
      })
    ).run();

    try {
      await (await createdInstruction.affirm()).run();
    } catch (error) {
      console.log('Sender affirmation skipped:', (error as Error).message);
    }

    const receiverInstruction = await investorApi.settlements.getInstruction({
      id: createdInstruction.id,
    });
    try {
      await (await receiverInstruction.affirm()).run();
    } catch (error) {
      console.log('Receiver affirmation skipped:', (error as Error).message);
    }

    const [fundedBalance] = await investorDefault.getAssetBalances({
      assets: [raisingCurrency],
    });

    if (!fundedBalance?.free.gte(requiredFunds)) {
      throw new Error(
        `Investor still lacks raising currency after settlement (free: ${fundedBalance?.free.toString() ?? '0'})`
      );
    }

    console.log(`Funded investor ${investor.did} with ${raisingCurrency}`);
  }

  try {
    await (await asset.compliance.requirements.pause()).run();
    console.log('Paused compliance for the offering asset');
  } catch (error) {
    console.log('Compliance pause skipped:', (error as Error).message);
  }

  await aliceApi.disconnect();

  console.log(`Investing as ${investor.did}...\n`);
  const investorAsset = await getFungibleAsset(investorApi, assetInput);
  const investorOfferings = await investorAsset.offerings.get({
    status: {
      sale: OfferingSaleStatus.Live,
      balance: OfferingBalanceStatus.Available,
    },
  });
  const investorOffering = investorOfferings.find(
    ({ offering }) => offering.id.eq(offeringId)
  )?.offering;

  if (!investorOffering) {
    await investorApi.disconnect();
    throw new Error('Could not find the target offering');
  }

  const fundingPortfolio = await investor.portfolios.getPortfolio();
  let purchasePortfolio = fundingPortfolio;
  let usingSeparatePurchasePortfolio = false;

  try {
    purchasePortfolio = await investor.portfolios.getPortfolio({
      portfolioId: new BigNumber(2),
    });
    usingSeparatePurchasePortfolio = true;
  } catch {
    console.log('Using default portfolio as purchase portfolio');
  }

  const currencyAssetInvestor = await getFungibleAsset(investorApi, raisingCurrency);
  if (usingSeparatePurchasePortfolio) {
    try {
      const transferQ = await fundingPortfolio.moveFunds({
        to: purchasePortfolio,
        items: [{ asset: currencyAssetInvestor.id, amount: requiredFunds.multipliedBy(2) }],
      });
      await transferQ.run();
    } catch (error) {
      console.log('Skipping portfolio move:', (error as Error).message);
    }
  }

  const [investorAccount] = await investorApi.accountManagement.getSigningAccounts();

  const sponsorApi = await connectAs(process.env.ACCOUNT_SEED ?? '//Alice');
  await (
    await sponsorApi.network.transferPolyx({
      to: investorAccount.address,
      amount: new BigNumber(100),
    })
  ).run();
  await sponsorApi.disconnect();

  const investQ = await investorOffering.invest({
    purchasePortfolio,
    fundingPortfolio,
    purchaseAmount,
    maxPrice,
  });

  await investQ.run();
  console.log('Investment successful');

  await investorApi.disconnect();
})();
