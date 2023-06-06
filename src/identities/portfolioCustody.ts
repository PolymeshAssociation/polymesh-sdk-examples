import { Polymesh } from '@polymeshassociation/polymesh-sdk';

/*
  This script showcases Portfolio's Custodian related functionality. It:
    - Creates a Portfolio
    - Fetches owner and Custodian for that Portfolio
    - Sets a different Custodian to that Portfolio
    - Fetches owned Portfolios
    - Fetches Portfolios in custody
    - Quits Portfolio custody

  It assumes the custodian's primary Account is present in the SDK's signing manager
*/
export const portfolioCustody = async (sdk: Polymesh, custodianDid: string): Promise<void> => {
  const custodian = await sdk.identities.getIdentity({ did: custodianDid });
  const { account: custodianAccount } = await custodian.getPrimaryAccount();

  const identity = await sdk.getSigningIdentity();
  if (!identity) {
    throw new Error('the SDK must have a signing identity');
  }

  const createPortfolioTx = await sdk.identities.createPortfolio({ name: 'CUSTODY_PORTFOLIO' });
  const portfolio = await createPortfolioTx.run();
  // Here is how to check ownership and custody of a Portfolio
  const [portfolioCustodian, isOwnedByIdentity, isCustodiedByIdentity] = await Promise.all([
    portfolio.getCustodian(),
    portfolio.isOwnedBy({ identity }),
    portfolio.isCustodiedBy({ identity }),
  ]);
  const setCustodianTx = await portfolio.setCustodian({ targetIdentity: custodian });

  // The auth request can also be retrieved with `custodian.authorizations.getReceived()`
  const authRequest = await setCustodianTx.run();
  // `.getReceived` can be called and inspected instead
  custodian.authorizations.getOne({ id: authRequest.authId });

  // The custodian needs to accept the created authorization
  const acceptTx = await authRequest.accept({ signingAccount: custodianAccount });

  const middlewareSynced = () => new Promise(resolve => acceptTx.onProcessedByMiddleware(resolve));

  await acceptTx.run();
  const [newCustodian, isCustodiedByOwner] = await Promise.all([
    portfolio.getCustodian(),
    portfolio.isCustodiedBy({ identity }),
  ]);
  await middlewareSynced();

  // The custodian can get all non owned portfolios where they are the custodian - note there are pagination options
  const custodiedPortfolios = await custodian.portfolios.getCustodiedPortfolios();

  // Quit being a custodian of a Portfolio
  const [portfolioToQuit] = custodiedPortfolios.data;

  const quitCustodyTx = await portfolioToQuit.quitCustody({ signingAccount: custodianAccount });
  await quitCustodyTx.run();
};
