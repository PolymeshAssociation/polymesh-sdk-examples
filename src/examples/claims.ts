import { ClaimType, ScopeType } from '@polymeshassociation/polymesh-sdk/types';

import { getClient } from '~/common/client';
import { renderClaim } from '~/common/utils';

/*
  This script showcases Claim related functionality. It:
    - Add a claim
    - Revoke a claim
    - Get CDD claims
    - Get claims targeting a given Identity
    - Get claims issued by given Identity
*/
(async (): Promise<void> => {
  console.log('Connecting to the node...\n\n');
  const api = await getClient(process.env.ACCOUNT_SEED);

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const identity = (await api.getSigningIdentity())!;
  console.log(`Connected! Signing Identity ID: ${identity.did}`);

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const bobDid = process.env.BOB_DID!;

  const assetInput = process.argv[2];

  if (!assetInput) {
    throw new Error('Please supply a Asset ID as an argument to the script');
  }

  const addQ = await api.claims.addClaims({
    claims: [
      {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        target: bobDid,
        claim: {
          type: ClaimType.Accredited,
          scope: {
            type: ScopeType.Asset,
            value: assetInput,
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
            type: ScopeType.Asset,
            value: assetInput,
          },
        },
      },
    ],
  });

  console.log('Revoking claim...\n');
  await revokeQ.run();

  const cddClaims = await api.claims.getCddClaims();

  console.log('List of CDD claims for the signing Identity:\n');
  cddClaims.forEach((claim, i) => {
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
