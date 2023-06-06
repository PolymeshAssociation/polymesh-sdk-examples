import { Polymesh } from '@polymeshassociation/polymesh-sdk';
import { ClaimType } from '@polymeshassociation/polymesh-sdk/types';

import { wellKnown } from '~/consts';

/*
  This script showcases Compliance related functionality. It shows:
    - Setting trusted claim issuers
    - Getting existing trusted claim issuers
    - Adding a new claim issuer
    - Removing a claim issuer

  These issuers will be trusted implicitly in consideration of compliance restrictions
*/
export const manageTrustedClaimIssuers = async (sdk: Polymesh, ticker: string): Promise<void> => {
  const identity = await sdk.getSigningIdentity();
  if (!identity) {
    throw new Error('the SDK must have a signing identity');
  }

  // destructure to reduce `asset.` repetition
  const { compliance } = await sdk.assets.getAsset({ ticker });

  // Add a claim Issuer for trusted for all claims
  const addClaimIssuerTx = await compliance.trustedClaimIssuers.add({
    claimIssuers: [
      {
        identity,
        trustedFor: null,
      },
    ],
  });
  await addClaimIssuerTx.run();
  // Make Alice the only trusted issuer for certain claims
  const setTrustedClaimIssuersTx = await compliance.trustedClaimIssuers.set({
    claimIssuers: [
      {
        identity: wellKnown.alice.did,
        trustedFor: [ClaimType.Accredited, ClaimType.Affiliate],
      },
    ],
  });
  await setTrustedClaimIssuersTx.run();
  const defaultTrustedIssuers = await compliance.trustedClaimIssuers.get();
  // Remove a trusted issuers. Identities no longer compliant will be able to send, but not receive the Asset
  const removeClaimIssuerTx = await compliance.trustedClaimIssuers.remove({
    claimIssuers: [wellKnown.alice.did],
  });
  await removeClaimIssuerTx.run();
};
