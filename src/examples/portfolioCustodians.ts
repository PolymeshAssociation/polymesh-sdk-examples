import { getClient } from '~/common/client';

/* 
  This script showcases Portfolio's Custodian related functonality. It:    
    - Creates a Portfolio
    - Fetches owner and Custodian for that Portfolio
    - Sets a different Custodian to that Portfolio
    - Fetches owned Portfolios
    - Fetches Portfolios in custody
*/
(async (): Promise<void> => {
  console.log('Connecting to the node...\n\n');
  const api = await getClient(process.env.ACCOUNT_SEED);

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const bob = api.getIdentity({ did: process.env.BOB_DID! });

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const identity = (await api.getCurrentIdentity())!;
  console.log(`Connected! Current identity ID: ${identity.did}`);

  const portfolioQ = await identity.portfolios.create({ name: 'MY_PORTFOLIO' });
  const portfolio = await portfolioQ.run();

  // In this case portfolioOwner.did will be identity.did
  let portfolioOwner = portfolio.owner;
  console.log(`Portfolio owner is: ${portfolioOwner.did}`);

  // In this case portfolioCustodian.did will be identity.did
  let portfolioCustodian = await portfolio.getCustodian();
  console.log(`Portfolio custodian is: ${portfolioCustodian.did}`);

  // In this case it will return true
  let isOwnedByIdentity = portfolio.isOwnedBy({ identity });
  console.log(`Portfolio is owned by ${identity.did}: ${isOwnedByIdentity}`);

  // In this case it will return true
  let isCustodiedByIdentity = portfolio.isCustodiedBy({ identity });
  console.log(`Portfolio is custodied by ${identity.did}: ${isCustodiedByIdentity}`);

  // Bob needs to accept the authorization created
  const setPortfolioQ = await portfolio.setCustodian({ targetIdentity: bob });
  await setPortfolioQ.run();

  // After Bob accepts the authorization

  // Portfolio owner has not changed
  portfolioOwner = portfolio.owner;
  console.log(`Portfolio owner is: ${portfolioOwner.did}`);

  // Portfolio custodian is Bob now
  portfolioCustodian = await portfolio.getCustodian();
  console.log(`Portfolio custodian is: ${portfolioCustodian.did}`);

  // It will be false now
  isOwnedByIdentity = portfolio.isOwnedBy({ identity });
  console.log(`Portfolio is owned by ${identity.did}: ${isCustodiedByIdentity}`);

  // It will be true now
  isCustodiedByIdentity = portfolio.isCustodiedBy({ identity });
  console.log(`Portfolio is custodied by ${identity.did}: ${isCustodiedByIdentity}`);

  // First element is always the default Portfolio
  const [, ...numberedPortfolios] = await identity.portfolios.getPortfolios();
  const isIncludedInOwned = numberedPortfolios.includes(portfolio); // Portfolio is still owned by current Identity
  console.log(`Included in portfolios owned by ${identity.did}: ${isIncludedInOwned}`);

  // Identity can filter those portfolios with a third party custodian
  const ownedButNotCustodiedPortfolios = numberedPortfolios.filter(
    p => !p.isCustodiedBy({ identity })
  );
  console.log(`Portfolios owned with a third party custodian: ${ownedButNotCustodiedPortfolios}`);

  // Bob can get all now owned portfolios where he is the custodian
  // getCustodiedPortfolios retrieves only portfolios owned by a different Identity but custodied by this one
  const custodiedPortfolios = await bob.portfolios.getCustodiedPortfolios();
  console.log(`Custodied Portfolios owned by a third party: ${custodiedPortfolios}`);
})();
