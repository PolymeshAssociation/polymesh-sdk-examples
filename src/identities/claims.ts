import { Polymesh } from '@polymeshassociation/polymesh-sdk';
import { ClaimType, ScopeType } from '@polymeshassociation/polymesh-sdk/types';

/*
  This function showcases Claim related functionality. It:
    - Add a claim
    - Waits for middleware to sync
    - Revoke a claim
    - Get CDD claims
    - Get investor uniqueness claims
    - Get claims targeting a given Identity
    - Get claims issued by given Identity
*/
export const manageClaims = async (sdk: Polymesh, targetDid: string): Promise<void> => {
  const identity = await sdk.getSigningIdentity();
  if (!identity) {
    throw new Error('the SDK must have an signing identity');
  }

  const { account: signingAccount } = await identity.getPrimaryAccount();

  // Prepare and run the add claim transaction
  const addClaimTx = await sdk.claims.addClaims(
    {
      claims: [
        {
          target: targetDid,
          claim: {
            type: ClaimType.Accredited,
            scope: {
              type: ScopeType.Ticker,
              value: 'TICKER',
            },
          },
        },
      ],
    },
    { signingAccount }
  );

  const middlewareSynced = () =>
    new Promise(resolve => addClaimTx.onProcessedByMiddleware(resolve));

  await addClaimTx.run();
  await middlewareSynced();

  // Get issued claims
  const issuedClaims = await sdk.claims.getIssuedClaims({
    target: identity.did,
    includeExpired: false,
  });
  // select the first one to revoke
  const claimToRevoke = issuedClaims.data[0];

  // Prepare and run the revoke claim transaction
  const revokeClaimTx = await sdk.claims.revokeClaims(
    {
      claims: [claimToRevoke],
    },
    { signingAccount }
  );
  await revokeClaimTx.run();
  // This following portion demonstrates different ways to fetch claims

  // Note, without specifying `target` the signingIdentity claims will be fetched
  const signerCddClaims = await sdk.claims.getCddClaims();
  const investorUniquenessClaims = await sdk.claims.getInvestorUniquenessClaims();
  // `target` can specify which Identity to fetch Claims for
  const targetingClaims = await sdk.claims.getTargetingClaims({ target: targetDid });
  // `target` here refers to the issuer of the claim
  const claimsIssuedByTarget = await sdk.claims.getIssuedClaims({ target: targetDid });
};
