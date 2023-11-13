import { ClaimType, ScopeType } from '@polymeshassociation/polymesh-sdk/types';

import { getClient } from '~/common/client';
import { parseArgs, renderClaim } from '~/common/utils';

/*
  This script showcases how to create a CustomClaimType and issue and revoke a CustomClaim

  Usage e.g: yarn run-example ./src/examples/customClaim.ts name=SomeClaimTypeName
*/
(async (): Promise<void> => {
  const { name } = parseArgs<ScriptArgs>(process.argv.slice(2));

  if (!name) {
    console.error('Please supply a name as an argument to the script');

    return;
  }

  console.log('Connecting to the node...\n\n');
  const api = await getClient(process.env.ACCOUNT_SEED);

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const identity = (await api.getSigningIdentity())!;
  console.log(`Connected! Signing Identity ID: ${identity.did}`);

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const bobDid = process.env.BOB_DID!;

  // register a CustomClaimType

  const registerCustomClaimTypeQ = await api.claims.registerCustomClaimType({ name });

  const customClaimTypeId = await registerCustomClaimTypeQ.run();

  console.log(`Registered Custom Claim Type ID: ${customClaimTypeId}`);

  // get a CustomClaimType by name
  const claimTypeByName = await api.claims.getCustomClaimTypeByName(name);

  console.log(
    `Custom Claim Type By Name result - id: ${claimTypeByName?.id}, name: ${claimTypeByName?.name}`
  );

  // get a CustomClaimType by name
  const claimTypeById = await api.claims.getCustomClaimTypeById(customClaimTypeId);

  console.log(
    `Custom Claim Type By Name result - id: ${claimTypeById?.id}, name: ${claimTypeById?.name}`
  );

  const addQ = await api.claims.addClaims({
    claims: [
      {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        target: bobDid,
        claim: {
          type: ClaimType.Custom,
          customClaimTypeId,
          scope: {
            type: ScopeType.Ticker,
            value: 'SOME_TICKER',
          },
        },
      },
    ],
  });

  console.log('\nAdding claim...\n');
  await addQ.run();

  const issuedClaims = await api.claims.getIssuedClaims({ target: bobDid });

  console.log(`List of claims issued by ${bobDid}\n`);
  issuedClaims.data.forEach((claim, i) => {
    renderClaim(claim, i + 1);
  });

  const revokeQ = await api.claims.revokeClaims({
    claims: [
      {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        target: bobDid,
        claim: {
          type: ClaimType.Custom,
          customClaimTypeId,
          scope: {
            type: ScopeType.Ticker,
            value: 'SOME_TICKER',
          },
        },
      },
    ],
  });

  console.log('Revoking claim...\n');
  await revokeQ.run();

  const issuedClaimsAfterRevoke = await api.claims.getIssuedClaims({ target: bobDid });

  console.log(`List of claims issued by ${bobDid}\n`);
  issuedClaimsAfterRevoke.data.forEach((claim, i) => {
    renderClaim(claim, i + 1);
  });

  await api.disconnect();
})();

type ScriptArgs = {
  name?: string;
};
