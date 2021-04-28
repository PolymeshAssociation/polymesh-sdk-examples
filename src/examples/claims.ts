import { ClaimData, ClaimType, ScopeType } from '@polymathnetwork/polymesh-sdk/types';

import { getClient } from '~/common/client';

/**
 * @hidden
 */
const renderClaim = ({ target, issuer, issuedAt, expiry, claim }: ClaimData, pos: number): void => {
  console.log(`Claim #${pos} ${issuedAt ? `issued at ${issuedAt}` : ``}`);
  console.log(`Target: ${target.did}`);
  console.log(`Issuer: ${issuer.did}`);
  if (expiry) {
    console.log(`Expiry date: ${expiry}`);
  }
  console.log(`Claim: ${claim.type}`);
  console.log('\n');
};

/* 
  This script showcases Claim related functonality. It:    
    - Add a claim
    - Revoke a claim
    - Get CDD claims
    - Get uniqueness investor claims
    - Get claims targeting a given Identity
    - Get claims issued by given Identity
*/
(async (): Promise<void> => {
  console.log('Connecting to the node...\n\n');
  const api = await getClient(process.env.ACCOUNT_SEED);

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const identity = (await api.getCurrentIdentity())!;
  console.log(`Connected! Current identity ID: ${identity.did}`);

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const bobDid = process.env.BOB_DID!;

  const addQ = await api.claims.addClaims({
    claims: [
      {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        target: bobDid,
        claim: {
          type: ClaimType.Accredited,
          scope: {
            type: ScopeType.Ticker,
            value: 'SOMETICKER',
          },
        },
      },
    ],
  });

  console.log('\nAdding claim...\n');
  await addQ.run();

  const revokeQ = await api.claims.revokeClaims({
    claims: [
      {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        target: bobDid,
        claim: {
          type: ClaimType.Accredited,
          scope: {
            type: ScopeType.Ticker,
            value: 'SOMETICKER',
          },
        },
      },
    ],
  });

  console.log('Revoking claim...\n');
  await revokeQ.run();

  const cddClaims = await api.claims.getCddClaims();

  console.log('List of CDD claims for the current identity:\n');
  cddClaims.forEach((claim, i) => {
    renderClaim(claim, i + 1);
  });

  const investorUniquenessClaims = await api.claims.getInvestorUniquenessClaims();

  console.log('List of InvestorUniqueness claims for the current identity:\n');
  investorUniquenessClaims.forEach((claim, i) => {
    renderClaim(claim, i + 1);
  });

  const targetingClaims = await api.claims.getTargetingClaims({ target: bobDid });

  console.log(`List of claims targeting to ${bobDid}\n`);
  targetingClaims.data.forEach(({ identity, claims }) => {
    console.log(`Identity: ${identity.did}`);
    claims.forEach((claim, i) => renderClaim(claim, i + 1));
  });

  const issuedClaims = await api.claims.getIssuedClaims({ target: bobDid });

  console.log(`List of claims issued by ${bobDid}\n`);
  issuedClaims.data.forEach((claim, i) => {
    renderClaim(claim, i + 1);
  });

  await api.disconnect();
})();
