import { BigNumber, Polymesh } from '@polymeshassociation/polymesh-sdk';

/*
  This script retrieves the balance of a specific asset
    held by an Identity
*/
export const getIdentityAssetBalance = async (
  sdk: Polymesh,
  did: string,
  ticker: string
): Promise<BigNumber> => {
  const identity = await sdk.identities.getIdentity({ did });

  return identity.getAssetBalance({ ticker });
};
